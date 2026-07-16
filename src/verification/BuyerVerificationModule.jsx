import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  FileArrowUp,
  LockKey,
  ShieldCheck,
  UserCircle,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../auth/AuthContext.jsx";
import { ConfirmationModal } from "../auth/AuthModule.jsx";
import {
  REVIEWERS,
  VERIFICATION_CONTENT,
  VERIFICATION_STATUSES,
} from "./buyerVerificationData.js";
import { buyerVerificationService } from "./buyerVerificationService.js";

export const VERIFICATION_VIEWS = new Set([
  "buyer-verification",
  "admin-verifications",
  "admin-verification-detail",
]);
const SELECTED_APPLICATION_KEY = "beatmondo-selected-verification";

const statusDescriptions = {
  Draft: "Your buyer verification application has not yet been submitted.",
  Submitted:
    "Your application has been received and is awaiting initial review.",
  "Under Review":
    "A beatmondo reviewer is verifying your professional and company information.",
  "Additional Information Required":
    "We need additional information before we can complete your verification.",
  Resubmitted:
    "Your response was received and review will resume with the assigned reviewer.",
  Approved: "Your professional buyer access has been approved.",
  "Approved with Restrictions":
    "Your buyer access has been approved with specific catalog or delivery restrictions.",
  Rejected:
    "We could not approve professional buyer access based on the information currently available.",
  "Reverification Required":
    "Updated information is required to maintain your professional access.",
  Suspended: "Your professional buyer access is temporarily restricted.",
  Reinstated: "Your professional buyer access has been restored.",
};

const stageLabels = [
  "Application Started",
  "Application Submitted",
  "Initial Review",
  "Professional Verification",
  "Company Verification",
  "Access Decision",
  "Complete",
];
const stepLabels = [
  "Professional Profile",
  "Company Details",
  "Intended Music Usage",
  "Licensing Experience",
  "Projects and Credits",
  "References",
  "Supporting Documents",
  "Access Request",
  "Review and Declaration",
  "Submission Confirmation",
];

function StatusBadge({ status }) {
  return (
    <span
      className={`verification-status status-${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      {status}
    </span>
  );
}
function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not set";
}
function reviewerName(id) {
  return REVIEWERS.find((item) => item.id === id)?.name || "Unassigned";
}

function VerificationProgress({ application }) {
  const stage =
    application.status === "Draft"
      ? 0
      : application.status === "Submitted"
        ? 1
        : application.status === "Initial Review"
          ? 2
          : [
                "Under Review",
                "Additional Information Required",
                "Resubmitted",
                "Escalated",
              ].includes(application.status)
            ? 3
            : [
                  "Approved",
                  "Approved with Restrictions",
                  "Rejected",
                  "Suspended",
                  "Reinstated",
                ].includes(application.status)
              ? 6
              : 4;
  return (
    <ol
      className="verification-progress"
      aria-label="Buyer verification progress"
    >
      {stageLabels.map((label, index) => (
        <li
          key={label}
          className={
            index < stage ? "complete" : index === stage ? "active" : ""
          }
        >
          <span>{index < stage ? <CheckCircle /> : index + 1}</span>
          <strong>{label}</strong>
          {index === stage && <small>Current stage</small>}
        </li>
      ))}
    </ol>
  );
}

export function BuyerVerificationPage({ navigate, showToast }) {
  const { user, revision, refresh } = useAuth();
  const [application, setApplication] = useState(() =>
    buyerVerificationService.getByUser(user?.id),
  );
  const [mode, setMode] = useState("overview");
  useEffect(
    () => setApplication(buyerVerificationService.getByUser(user?.id)),
    [user?.id, revision],
  );
  if (!user) return null;
  const reload = (next = null) => {
    setApplication(next || buyerVerificationService.getByUser(user.id));
    refresh();
  };
  const start = async () => {
    const result = await buyerVerificationService.createDraft(user);
    if (result.ok) {
      reload(result.application);
      setMode("application");
      showToast("Buyer verification draft created.");
    } else if (result.application) {
      reload(result.application);
      setMode(
        result.application.status === "Draft" ? "application" : "overview",
      );
    }
  };
  if (!application)
    return (
      <section className="verification-page">
        <header className="verification-hero">
          <span className="eyebrow">Buyer verification</span>
          <h2>Unlock professional sync licensing access.</h2>
          <p>{VERIFICATION_CONTENT.introduction}</p>
          <button className="gold-button" onClick={start}>
            Start verification application
          </button>
        </header>
        <VerificationBenefits />
      </section>
    );
  if (
    mode === "application" &&
    [
      "Draft",
      "Additional Information Required",
      "Reverification Required",
    ].includes(application.status)
  )
    return (
      <VerificationWizard
        application={application}
        user={user}
        onUpdate={reload}
        onExit={() => setMode("overview")}
        showToast={showToast}
      />
    );
  return (
    <VerificationOverview
      application={application}
      user={user}
      navigate={navigate}
      onContinue={() =>
        setMode(application.status === "Draft" ? "application" : "overview")
      }
      onReapply={start}
      onEdit={() => setMode("application")}
      onUpdate={reload}
      showToast={showToast}
    />
  );
}

function VerificationBenefits() {
  return (
    <div className="verification-benefits">
      <article>
        <ShieldCheck />
        <strong>Professional Buyer</strong>
        <span>
          Projects, licensing requests, quotes, contracts, and approved
          delivery.
        </span>
      </article>
      <article>
        <LockKey />
        <strong>Secure delivery eligibility</strong>
        <span>
          Master and stem access remains separately reviewed and
          project-controlled.
        </span>
      </article>
      <article>
        <UserCircle />
        <strong>VIP Sync Access</strong>
        <span>
          Priority review, concierge support, premium catalog, and pre-approved
          terms where available.
        </span>
      </article>
    </div>
  );
}

function VerificationOverview({
  application,
  user,
  navigate,
  onContinue,
  onReapply,
  onEdit,
  onUpdate,
  showToast,
}) {
  const outstanding =
    application.informationRequests?.filter((item) => item.status === "Open") ||
    [];
  const approved =
    application.status.startsWith("Approved") ||
    application.status === "Reinstated";
  const withdraw = () => {
    const result = buyerVerificationService.withdraw(
      application.id,
      user,
      "Buyer withdrew through the verification overview.",
    );
    if (result.ok) {
      onUpdate(result.application);
      showToast("Verification application withdrawn.");
    }
  };
  return (
    <section className="verification-page">
      <header className="verification-overview-head">
        <div>
          <span className="eyebrow">
            Buyer verification · {application.reference}
          </span>
          <h2>{application.buyerName}</h2>
          <p>
            {statusDescriptions[application.status] ||
              VERIFICATION_CONTENT.introduction}
          </p>
        </div>
        <div>
          <StatusBadge status={application.status} />
          <span className="tier-badge">{application.currentAccessTier}</span>
        </div>
      </header>
      {[
        "Additional Information Required",
        "Reverification Required",
        "Suspended",
      ].includes(application.status) && (
        <div className="verification-action-banner">
          <WarningCircle size={28} />
          <div>
            <strong>
              {application.status === "Suspended"
                ? "Professional access restricted"
                : "Your response is required"}
            </strong>
            <span>
              {outstanding[0]?.buyerExplanation ||
                application.buyerVisibleMessages?.[0]?.body}
            </span>
            {outstanding[0]?.dueDate && (
              <small>
                Requested by {outstanding[0].reviewer} · Due{" "}
                {formatDate(outstanding[0].dueDate)}
              </small>
            )}
          </div>
          <button className="gold-button" onClick={onEdit}>
            Submit information
          </button>
        </div>
      )}
      <div className="verification-summary-grid">
        <article>
          <span>Current access</span>
          <strong>{application.currentAccessTier}</strong>
        </article>
        <article>
          <span>Requested access</span>
          <strong>{application.requestedAccessTier}</strong>
        </article>
        <article>
          <span>Risk shown to buyer</span>
          <strong>Human review</strong>
        </article>
        <article>
          <span>Last updated</span>
          <strong>
            {formatDate(
              application.activity?.[0]?.timestamp || application.submittedAt,
            )}
          </strong>
        </article>
        <article>
          <span>Assigned reviewer</span>
          <strong>{reviewerName(application.assignedReviewerId)}</strong>
        </article>
        <article>
          <span>Review guidance</span>
          <strong>
            {application.status === "Under Review"
              ? "Usually 2–3 business days"
              : "Status dependent"}
          </strong>
        </article>
      </div>
      <section className="verification-panel">
        <h3>Application progress</h3>
        <VerificationProgress application={application} />
      </section>
      {approved && (
        <section className="verification-panel">
          <div className="panel-heading-row">
            <div>
              <h3>Approved capabilities</h3>
              <p>
                Each delivery entitlement remains visible and separately
                enforced.
              </p>
            </div>
            <span className="verification-approved-icon">
              <CheckCircle />
            </span>
          </div>
          <div className="entitlement-grid">
            <span
              className={
                application.secureDeliveryApproved ? "enabled" : "disabled"
              }
            >
              Secure delivery
              <strong>
                {application.secureDeliveryApproved
                  ? "Approved"
                  : "Project approval required"}
              </strong>
            </span>
            <span
              className={
                application.masterAccessApproved ? "enabled" : "disabled"
              }
            >
              WAV masters
              <strong>
                {application.masterAccessApproved ? "Approved" : "Not enabled"}
              </strong>
            </span>
            <span
              className={
                application.stemAccessApproved ? "enabled" : "disabled"
              }
            >
              Stem packages
              <strong>
                {application.stemAccessApproved ? "Approved" : "Not enabled"}
              </strong>
            </span>
            <span
              className={application.preApprovedTerms ? "enabled" : "disabled"}
            >
              Pre-approved terms
              <strong>
                {application.preApprovedTerms ? "Available" : "Quote based"}
              </strong>
            </span>
          </div>
          <p>
            Next reverification:{" "}
            <strong>{formatDate(application.nextReviewAt)}</strong>
          </p>
          {application.restrictions?.length > 0 && (
            <RestrictionList restrictions={application.restrictions} />
          )}
        </section>
      )}
      {application.status === "Rejected" && (
        <section className="verification-panel decision-safe">
          <h3>Verification decision</h3>
          <p>
            {application.decision?.buyerMessage ||
              VERIFICATION_CONTENT.rejected}
          </p>
          <span>
            Reapplication available:{" "}
            <strong>{formatDate(application.reapplicationAllowedAt)}</strong>
          </span>
          {new Date(application.reapplicationAllowedAt).getTime() <=
            Date.now() && (
            <button className="gold-button" onClick={onReapply}>
              Start a new application
            </button>
          )}
        </section>
      )}
      <section className="verification-panel">
        <div className="panel-heading-row">
          <div>
            <h3>Buyer-visible updates</h3>
            <p>
              Private reviewer notes and risk rationale are never shown here.
            </p>
          </div>
          <button
            className="outline-button"
            onClick={() => navigate("notifications")}
          >
            Demo Messages
          </button>
        </div>
        <div className="verification-messages">
          {application.buyerVisibleMessages?.length ? (
            application.buyerVisibleMessages.map((message) => (
              <article key={message.id}>
                <strong>{message.title}</strong>
                <span>{message.body}</span>
                <small>{formatDate(message.createdAt)}</small>
              </article>
            ))
          ) : (
            <p>No new buyer messages.</p>
          )}
        </div>
      </section>
      <VerificationBenefits />
      <div className="verification-page-actions">
        {application.status === "Draft" && (
          <button className="gold-button" onClick={onContinue}>
            Continue application
          </button>
        )}
        {[
          "Draft",
          "Submitted",
          "Initial Review",
          "Under Review",
          "Additional Information Required",
        ].includes(application.status) && (
          <button className="outline-button" onClick={withdraw}>
            Withdraw application
          </button>
        )}
        <button className="plain-button" onClick={() => navigate("contact")}>
          Contact support
        </button>
      </div>
    </section>
  );
}

function VerificationWizard({
  application,
  user,
  onUpdate,
  onExit,
  showToast,
}) {
  const [app, setApp] = useState(application);
  const [step, setStep] = useState(
    Math.min(8, Math.max(0, (application.progressStep || 1) - 1)),
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(true);
  const [projectDraft, setProjectDraft] = useState({
    name: "",
    productionCompany: "",
    client: "",
    role: user.jobTitle,
    type: "Advertising campaign",
    year: "2026",
    url: "",
    responsibility: "Music selection and licensing",
    notes: "",
  });
  const [referenceDraft, setReferenceDraft] = useState({
    name: "",
    company: "",
    jobTitle: "",
    email: "",
    relationship: "",
    permission: true,
    notes: "",
  });
  const sectionNames = [
    "professional",
    "company",
    "usage",
    "experience",
    null,
    null,
    null,
    "access",
    "declaration",
    null,
  ];
  const updateSection = (section, field, value) => {
    setSaved(false);
    setApp((current) => ({
      ...current,
      questionnaire: {
        ...current.questionnaire,
        [section]: { ...current.questionnaire[section], [field]: value },
      },
    }));
  };
  const saveCurrent = () => {
    const section = sectionNames[step];
    if (!section) {
      setSaved(true);
      return { ok: true, application: app };
    }
    const result = buyerVerificationService.saveStep(
      app.id,
      step + 1,
      section,
      app.questionnaire[section],
      user,
    );
    if (result.ok) {
      setApp(result.application);
      onUpdate(result.application);
      setSaved(true);
    }
    return result;
  };
  const validate = () => {
    if (
      step === 0 &&
      (!app.questionnaire.professional.legalName ||
        !app.questionnaire.professional.role)
    )
      return "Full legal name and professional role are required.";
    if (
      step === 1 &&
      (!app.questionnaire.company.legalName ||
        !app.questionnaire.company.website)
    )
      return "Company legal name and website are required.";
    if (step === 2 && !app.questionnaire.usage.projectTypes?.length)
      return "Select at least one primary project type.";
    if (
      step === 4 &&
      app.questionnaire.access.requestedTier !== "Discovery Access" &&
      !app.projects.length &&
      !app.questionnaire.experience.projectExplanation
    )
      return "Add at least one professional project or provide a project explanation in Licensing Experience.";
    if (
      step === 7 &&
      app.questionnaire.access.requestedTier === "VIP Sync Access" &&
      !app.questionnaire.access.vipReason
    )
      return "Explain why VIP Sync Access is required.";
    if (
      step === 8 &&
      !Object.values(app.questionnaire.declaration)
        .filter((_, key) => key < 6)
        .every(Boolean)
    )
      return "Accept every declaration before submitting.";
    return "";
  };
  const next = () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    const result = saveCurrent();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    setStep((value) => Math.min(9, value + 1));
  };
  const submit = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    saveCurrent();
    const result = await buyerVerificationService.submitApplication(
      app.id,
      user,
    );
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setApp(result.application);
    onUpdate(result.application);
    setStep(9);
    showToast(`Application ${result.application.reference} submitted.`);
  };
  const respond = () => {
    const result = buyerVerificationService.submitAdditionalInformation(
      app.id,
      "Requested professional, company, and supporting information supplied through the buyer workspace.",
      user,
    );
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onUpdate(result.application);
    showToast("Additional information submitted.");
    onExit();
  };
  return (
    <section className="verification-page verification-wizard">
      <header>
        <div>
          <span className="eyebrow">
            {app.reference} · {saved ? "Saved" : "Unsaved changes"}
          </span>
          <h2>{stepLabels[step]}</h2>
          <p>
            {app.status === "Draft"
              ? "Progress saves after each completed step and survives refresh."
              : "Update only the information requested by the assigned reviewer."}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </header>
      <ol
        className="verification-stepper"
        aria-label="Verification application steps"
      >
        {stepLabels.map((label, index) => (
          <li
            key={label}
            className={
              index === step ? "active" : index < step ? "complete" : ""
            }
          >
            <button
              onClick={() =>
                index <= Math.max(step, app.progressStep || 1) && setStep(index)
              }
              aria-current={index === step ? "step" : undefined}
            >
              <span>{index + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>
      {error && (
        <div className="verification-error" role="alert">
          <WarningCircle />
          {error}
        </div>
      )}
      <div className="verification-form-card">
        {step === 0 && (
          <ProfessionalStep
            data={app.questionnaire.professional}
            update={(field, value) =>
              updateSection("professional", field, value)
            }
            user={user}
          />
        )}
        {step === 1 && (
          <CompanyStep
            data={app.questionnaire.company}
            update={(field, value) => updateSection("company", field, value)}
            email={app.email}
          />
        )}
        {step === 2 && (
          <UsageStep
            data={app.questionnaire.usage}
            update={(field, value) => updateSection("usage", field, value)}
          />
        )}
        {step === 3 && (
          <ExperienceStep
            data={app.questionnaire.experience}
            update={(field, value) => updateSection("experience", field, value)}
          />
        )}
        {step === 4 && (
          <ProjectsStep
            app={app}
            draft={projectDraft}
            setDraft={setProjectDraft}
            onAdd={() => {
              if (!projectDraft.name) {
                setError("Project name is required.");
                return;
              }
              const result = buyerVerificationService.addProject(
                app.id,
                projectDraft,
                user,
              );
              setApp(result.application);
              onUpdate(result.application);
              setProjectDraft({
                ...projectDraft,
                name: "",
                client: "",
                url: "",
                notes: "",
              });
            }}
            onRemove={(id) => {
              const result = buyerVerificationService.removeProject(app.id, id);
              setApp(result.application);
              onUpdate(result.application);
            }}
          />
        )}
        {step === 5 && (
          <ReferencesStep
            app={app}
            draft={referenceDraft}
            setDraft={setReferenceDraft}
            onAdd={() => {
              if (
                !referenceDraft.name ||
                !/^\S+@\S+\.\S+$/.test(referenceDraft.email)
              ) {
                setError("Reference name and a valid work email are required.");
                return;
              }
              const result = buyerVerificationService.addReference(
                app.id,
                referenceDraft,
                user,
              );
              setApp(result.application);
              onUpdate(result.application);
              setReferenceDraft({
                ...referenceDraft,
                name: "",
                company: "",
                jobTitle: "",
                email: "",
                relationship: "",
                notes: "",
              });
            }}
          />
        )}
        {step === 6 && (
          <DocumentsStep
            app={app}
            onUpload={(file, category) => {
              const result = buyerVerificationService.uploadDocument(
                app.id,
                file,
                category,
                user,
              );
              setApp(result.application);
              onUpdate(result.application);
            }}
            onRemove={(id) => {
              const result = buyerVerificationService.removeDocument(
                app.id,
                id,
              );
              if (result.ok) {
                setApp(result.application);
                onUpdate(result.application);
              }
            }}
          />
        )}
        {step === 7 && (
          <AccessStep
            data={app.questionnaire.access}
            update={(field, value) => updateSection("access", field, value)}
          />
        )}
        {step === 8 && (
          <ReviewStep
            app={app}
            update={(field, value) =>
              updateSection("declaration", field, value)
            }
          />
        )}
        {step === 9 && <SubmissionConfirmation app={app} />}
      </div>
      <div className="verification-wizard-actions">
        {step > 0 && step < 9 && (
          <button
            className="outline-button"
            onClick={() => setStep((value) => value - 1)}
          >
            Back
          </button>
        )}
        <button
          className="plain-button"
          onClick={() => {
            saveCurrent();
            onExit();
          }}
        >
          Save and Exit
        </button>
        {step < 8 && (
          <button className="gold-button" onClick={next}>
            Save and Continue
          </button>
        )}
        {step === 8 && app.status === "Draft" && (
          <button className="gold-button" onClick={submit}>
            Submit application
          </button>
        )}
        {step === 8 &&
          [
            "Additional Information Required",
            "Reverification Required",
            "Suspended",
          ].includes(app.status) && (
            <button className="gold-button" onClick={respond}>
              Submit requested information
            </button>
          )}
        {step === 9 && (
          <button className="gold-button" onClick={onExit}>
            View verification status
          </button>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}
function ProfessionalStep({ data, update }) {
  return (
    <div className="verification-form-grid">
      <Field label="Full legal name">
        <input
          value={data.legalName}
          onChange={(e) => update("legalName", e.target.value)}
        />
      </Field>
      <Field label="Preferred name">
        <input
          value={data.preferredName}
          onChange={(e) => update("preferredName", e.target.value)}
        />
      </Field>
      <Field label="Phone">
        <input
          value={data.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
      </Field>
      <Field label="Country">
        <input
          value={data.country}
          onChange={(e) => update("country", e.target.value)}
        />
      </Field>
      <Field label="Time zone">
        <input
          value={data.timezone}
          onChange={(e) => update("timezone", e.target.value)}
        />
      </Field>
      <Field label="Job title">
        <input
          value={data.jobTitle}
          onChange={(e) => update("jobTitle", e.target.value)}
        />
      </Field>
      <Field label="Professional role">
        <select
          value={data.role}
          onChange={(e) => update("role", e.target.value)}
        >
          {[
            "Music Supervisor",
            "Assistant Music Supervisor",
            "Creative Producer",
            "Executive Producer",
            "Film Producer",
            "Trailer Producer",
            "Advertising Producer",
            "Agency Creative",
            "Music Coordinator",
            "Licensing Executive",
            "Brand Representative",
            "Broadcaster",
            "Game Producer",
            "Other",
          ].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
      <Field label="LinkedIn profile">
        <input
          type="url"
          value={data.linkedin}
          onChange={(e) => update("linkedin", e.target.value)}
        />
      </Field>
      <Field label="Years in media or licensing">
        <select
          value={data.yearsExperience}
          onChange={(e) => update("yearsExperience", e.target.value)}
        >
          <option>Under 1</option>
          <option>1–4</option>
          <option>5–10</option>
          <option>10+</option>
        </select>
      </Field>
    </div>
  );
}
function CompanyStep({ data, update, email }) {
  const publicDomain = /@(gmail|outlook|yahoo|hotmail)\./i.test(email);
  return (
    <>
      <div className="verification-form-grid">
        <Field label="Company legal name">
          <input
            value={data.legalName}
            onChange={(e) => update("legalName", e.target.value)}
          />
        </Field>
        <Field label="Trading name">
          <input
            value={data.tradingName}
            onChange={(e) => update("tradingName", e.target.value)}
          />
        </Field>
        <Field label="Company website">
          <input
            type="url"
            value={data.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </Field>
        <Field label="Company email domain">
          <span className="input-with-helper">
            <input
              value={data.emailDomain}
              onChange={(e) => update("emailDomain", e.target.value)}
            />
            <button onClick={() => update("emailDomain", email.split("@")[1])}>
              Use my domain
            </button>
          </span>
        </Field>
        <Field label="Company type">
          <select
            value={data.type}
            onChange={(e) => update("type", e.target.value)}
          >
            {[
              "Film studio",
              "Production company",
              "Advertising agency",
              "Creative agency",
              "Trailer house",
              "Television network",
              "Streaming platform",
              "Game studio",
              "Music supervision company",
              "Brand",
              "Broadcaster",
              "Independent professional",
              "Other",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Company size">
          <select
            value={data.size}
            onChange={(e) => update("size", e.target.value)}
          >
            <option>1–10</option>
            <option>11–50</option>
            <option>51–250</option>
            <option>251+</option>
          </select>
        </Field>
        <Field label="Headquarters country">
          <input
            value={data.headquarters}
            onChange={(e) => update("headquarters", e.target.value)}
          />
        </Field>
        <Field label="Year established">
          <input
            value={data.established}
            onChange={(e) => update("established", e.target.value)}
          />
        </Field>
        <Field label="Main business activity">
          <textarea
            value={data.activity}
            onChange={(e) => update("activity", e.target.value)}
          />
        </Field>
        <Field label="Company address">
          <textarea
            value={data.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </Field>
      </div>
      {publicDomain && (
        <div className="verification-warning">
          <WarningCircle />A public email domain may require stronger project,
          credit, or reference evidence. Submission is still allowed.
        </div>
      )}
    </>
  );
}
function ToggleSet({ values, options, update }) {
  const list = values || [];
  return (
    <div className="verification-toggle-set">
      {options.map((option) => (
        <button
          key={option}
          className={list.includes(option) ? "active" : ""}
          onClick={() =>
            update(
              list.includes(option)
                ? list.filter((item) => item !== option)
                : [...list, option],
            )
          }
        >
          {option}
        </button>
      ))}
    </div>
  );
}
function UsageStep({ data, update }) {
  return (
    <div className="verification-stacked-form">
      <Field label="Primary project types">
        <ToggleSet
          values={data.projectTypes}
          options={[
            "Feature film",
            "Television",
            "Streaming series",
            "Documentary",
            "Advertising campaign",
            "Trailer",
            "Video game",
            "Corporate production",
            "Social campaign",
            "Branded content",
            "Live event",
          ]}
          update={(value) => update("projectTypes", value)}
        />
      </Field>
      <Field label="Typical media">
        <ToggleSet
          values={data.media}
          options={[
            "Television",
            "Cinema",
            "Online video",
            "Social media",
            "Streaming",
            "Radio",
            "In-store",
            "Game",
            "All media",
          ]}
          update={(value) => update("media", value)}
        />
      </Field>
      <Field label="Typical territories">
        <ToggleSet
          values={data.territories}
          options={[
            "Local",
            "National",
            "Regional",
            "North America",
            "Europe",
            "Global",
          ]}
          update={(value) => update("territories", value)}
        />
      </Field>
      <div className="verification-form-grid">
        <Field label="Annual licensing volume">
          <select
            value={data.annualVolume}
            onChange={(e) => update("annualVolume", e.target.value)}
          >
            <option>1–5 licences</option>
            <option>6–12 licences</option>
            <option>13–30 licences</option>
            <option>30+ licences</option>
          </select>
        </Field>
        <Field label="Typical budget">
          <select
            value={data.budget}
            onChange={(e) => update("budget", e.target.value)}
          >
            <option>Under $5k</option>
            <option>$5k–$10k</option>
            <option>$10k–$25k</option>
            <option>$25k–$50k</option>
            <option>$50k+</option>
          </select>
        </Field>
        <Field label="Intended first project">
          <textarea
            value={data.firstProject}
            onChange={(e) => update("firstProject", e.target.value)}
          />
        </Field>
      </div>
      <div className="verification-checkbox-grid">
        {[
          ["masters", "Need WAV masters"],
          ["stems", "Need stems"],
          ["instrumentals", "Need instrumentals"],
          ["cleanVersions", "Need clean versions"],
          ["rush", "Need rush clearance"],
          ["concierge", "Interested in VIP concierge"],
          ["preApprovedTerms", "Interested in pre-approved terms"],
        ].map(([field, label]) => (
          <label key={field}>
            <input
              type="checkbox"
              checked={Boolean(data[field])}
              onChange={(e) => update(field, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
function ExperienceStep({ data, update }) {
  return (
    <div className="verification-form-grid">
      <Field label="Previously licensed commercial music">
        <select
          value={data.licensedBefore ? "Yes" : "No"}
          onChange={(e) => update("licensedBefore", e.target.value === "Yes")}
        >
          <option>Yes</option>
          <option>No</option>
        </select>
      </Field>
      <Field label="Approximate completed licences">
        <select
          value={data.licenceCount}
          onChange={(e) => update("licenceCount", e.target.value)}
        >
          <option>0</option>
          <option>1–5</option>
          <option>6–20</option>
          <option>20+</option>
        </select>
      </Field>
      <Field label="Typical licence value">
        <input
          value={data.typicalValue}
          onChange={(e) => update("typicalValue", e.target.value)}
        />
      </Field>
      <Field label="Existing commercial terms">
        <input
          value={data.terms}
          onChange={(e) => update("terms", e.target.value)}
        />
      </Field>
      <Field label="Existing master or publishing relationships">
        <textarea
          value={data.relationships}
          onChange={(e) => update("relationships", e.target.value)}
        />
      </Field>
      {!data.licensedBefore && (
        <Field label="Current project context">
          <textarea
            value={data.projectExplanation || ""}
            onChange={(e) => update("projectExplanation", e.target.value)}
            placeholder="Explain the project and your music licensing responsibility."
          />
        </Field>
      )}
      <div className="verification-checkbox-grid full-field">
        {[
          ["publishers", "Worked with publishers"],
          ["masterOwners", "Worked with master owners"],
          ["cueSheets", "Cue sheet experience"],
          ["negotiations", "Territory and term negotiation"],
          ["libraries", "Music library experience"],
          ["secureAssets", "Previous secure master or stem access"],
        ].map(([field, label]) => (
          <label key={field}>
            <input
              type="checkbox"
              checked={Boolean(data[field])}
              onChange={(e) => update(field, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
function ProjectsStep({ app, draft, setDraft, onAdd, onRemove }) {
  const update = (field, value) =>
    setDraft((current) => ({ ...current, [field]: value }));
  return (
    <div>
      <div className="verification-repeat-list">
        {app.projects.map((project, index) => (
          <article key={project.id}>
            <span>{index + 1}</span>
            <div>
              <strong>{project.name}</strong>
              <small>
                {project.productionCompany} · {project.role} · {project.year}
              </small>
            </div>
            <button onClick={() => onRemove(project.id)}>Remove</button>
          </article>
        ))}
      </div>
      <h3>Add professional credit</h3>
      <div className="verification-form-grid">
        <Field label="Project name">
          <input
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="Production company">
          <input
            value={draft.productionCompany}
            onChange={(e) => update("productionCompany", e.target.value)}
          />
        </Field>
        <Field label="Client or studio">
          <input
            value={draft.client}
            onChange={(e) => update("client", e.target.value)}
          />
        </Field>
        <Field label="Role">
          <input
            value={draft.role}
            onChange={(e) => update("role", e.target.value)}
          />
        </Field>
        <Field label="Project type">
          <input
            value={draft.type}
            onChange={(e) => update("type", e.target.value)}
          />
        </Field>
        <Field label="Release year">
          <input
            value={draft.year}
            onChange={(e) => update("year", e.target.value)}
          />
        </Field>
        <Field label="Public URL">
          <input
            type="url"
            value={draft.url}
            onChange={(e) => update("url", e.target.value)}
          />
        </Field>
        <Field label="Music usage responsibility">
          <textarea
            value={draft.responsibility}
            onChange={(e) => update("responsibility", e.target.value)}
          />
        </Field>
      </div>
      <button className="outline-button" onClick={onAdd}>
        Add project
      </button>
    </div>
  );
}
function ReferencesStep({ app, draft, setDraft, onAdd }) {
  const update = (field, value) =>
    setDraft((current) => ({ ...current, [field]: value }));
  return (
    <div>
      <div className="verification-repeat-list">
        {app.references.map((reference) => (
          <article key={reference.id}>
            <UserCircle />
            <div>
              <strong>{reference.name}</strong>
              <small>
                {reference.company} · {reference.email}
              </small>
            </div>
            <StatusBadge status={reference.status} />
          </article>
        ))}
      </div>
      <h3>Add professional reference</h3>
      <div className="verification-form-grid">
        <Field label="Reference name">
          <input
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="Company">
          <input
            value={draft.company}
            onChange={(e) => update("company", e.target.value)}
          />
        </Field>
        <Field label="Job title">
          <input
            value={draft.jobTitle}
            onChange={(e) => update("jobTitle", e.target.value)}
          />
        </Field>
        <Field label="Work email">
          <input
            type="email"
            value={draft.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>
        <Field label="Relationship">
          <input
            value={draft.relationship}
            onChange={(e) => update("relationship", e.target.value)}
          />
        </Field>
        <label className="verification-check">
          <input
            type="checkbox"
            checked={draft.permission}
            onChange={(e) => update("permission", e.target.checked)}
          />
          Permission to contact
        </label>
      </div>
      <button className="outline-button" onClick={onAdd}>
        Add reference
      </button>
    </div>
  );
}
function DocumentsStep({ app, onUpload, onRemove }) {
  const [category, setCategory] = useState("Employment verification");
  return (
    <div>
      <div className="prototype-upload-note">
        <FileArrowUp />
        <div>
          <strong>Simulated document upload</strong>
          <span>
            File metadata is stored locally. No file is sent to a server.
          </span>
        </div>
      </div>
      <div className="document-upload-row">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {[
            "Company identification",
            "Employment verification",
            "Business card",
            "Production credit evidence",
            "Client engagement evidence",
            "Professional reference letter",
            "Company registration",
            "Existing licence agreement",
            "Other supporting material",
          ].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className="gold-button">
          Choose file
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            onChange={(e) =>
              e.target.files?.[0] && onUpload(e.target.files[0], category)
            }
          />
        </label>
      </div>
      <div className="document-card-grid">
        {app.documents.map((doc) => (
          <article key={doc.id}>
            <FileArrowUp />
            <div>
              <strong>{doc.name}</strong>
              <span>
                {doc.category} · {doc.size}
              </span>
              <small>
                {doc.status} · {formatDate(doc.uploadedAt)}
              </small>
            </div>
            {["Draft", "Additional Information Required"].includes(
              app.status,
            ) && <button onClick={() => onRemove(doc.id)}>Remove</button>}
          </article>
        ))}
      </div>
    </div>
  );
}
function AccessStep({ data, update }) {
  return (
    <div>
      <div className="access-comparison">
        {[
          ["Discovery Access", "Curated browsing, previews, saved tracks"],
          [
            "Professional Buyer",
            "Projects, licensing, quotes, contracts, approved delivery",
          ],
          [
            "VIP Sync Access",
            "Priority review, concierge, VIP catalog, premium asset eligibility",
          ],
        ].map(([tier, text]) => (
          <button
            key={tier}
            className={data.requestedTier === tier ? "active" : ""}
            onClick={() => update("requestedTier", tier)}
          >
            <strong>{tier}</strong>
            <span>{text}</span>
          </button>
        ))}
      </div>
      {data.requestedTier === "VIP Sync Access" && (
        <div className="verification-form-grid">
          <Field label="Reason for VIP request">
            <textarea
              value={data.vipReason}
              onChange={(e) => update("vipReason", e.target.value)}
            />
          </Field>
          <Field label="Expected licensing volume">
            <input
              value={data.expectedVolume}
              onChange={(e) => update("expectedVolume", e.target.value)}
            />
          </Field>
          <Field label="Typical project urgency">
            <select
              value={data.urgency}
              onChange={(e) => update("urgency", e.target.value)}
            >
              <option>Standard</option>
              <option>Frequent rush</option>
              <option>Campaign critical</option>
            </select>
          </Field>
          <Field label="Premium asset needs">
            <input
              value={data.premiumAssets}
              onChange={(e) => update("premiumAssets", e.target.value)}
            />
          </Field>
          <label className="verification-check">
            <input
              type="checkbox"
              checked={data.concierge}
              onChange={(e) => update("concierge", e.target.checked)}
            />
            Interested in concierge support
          </label>
        </div>
      )}
      <p className="muted-note">
        Requesting VIP Sync Access does not guarantee VIP approval. Eligibility
        and asset access are reviewed separately.
      </p>
    </div>
  );
}
function ReviewStep({ app, update }) {
  const d = app.questionnaire.declaration;
  return (
    <div>
      <div className="verification-review-grid">
        <article>
          <span>Professional</span>
          <strong>{app.questionnaire.professional.legalName}</strong>
          <small>{app.questionnaire.professional.role}</small>
        </article>
        <article>
          <span>Company</span>
          <strong>{app.questionnaire.company.legalName}</strong>
          <small>{app.questionnaire.company.website}</small>
        </article>
        <article>
          <span>Usage</span>
          <strong>
            {app.questionnaire.usage.projectTypes.join(", ") || "Not provided"}
          </strong>
          <small>{app.questionnaire.usage.territories.join(", ")}</small>
        </article>
        <article>
          <span>Evidence</span>
          <strong>
            {app.projects.length} projects · {app.references.length} references
          </strong>
          <small>{app.documents.length} supporting documents</small>
        </article>
        <article>
          <span>Requested access</span>
          <strong>{app.questionnaire.access.requestedTier}</strong>
          <small>Human review required</small>
        </article>
      </div>
      <fieldset className="declaration-list">
        <legend>Declarations</legend>
        {[
          ["accurate", "The information is accurate."],
          ["authorized", "I am authorized to represent the company."],
          ["mayVerify", "beatmondo may verify professional information."],
          ["revocable", "I understand access can be restricted or revoked."],
          ["terms", "I agree to the platform Terms and Privacy Policy."],
          [
            "assetApproval",
            "I acknowledge that master and stem access require separate approval.",
          ],
        ].map(([field, label]) => (
          <label key={field}>
            <input
              type="checkbox"
              checked={Boolean(d[field])}
              onChange={(e) => update(field, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <p className="privacy-note">{VERIFICATION_CONTENT.privacy}</p>
    </div>
  );
}
function SubmissionConfirmation({ app }) {
  return (
    <div className="submission-confirmation">
      <CheckCircle size={54} />
      <span className="eyebrow">Application submitted</span>
      <h3>{app.reference}</h3>
      <p>
        Your application is locked for human review. Status changes and requests
        will appear in the verification overview and Demo Messages.
      </p>
    </div>
  );
}
function RestrictionList({ restrictions }) {
  return (
    <div className="restriction-box">
      <strong>Access restrictions</strong>
      <ul>
        {restrictions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function AdminVerificationQueue({ navigate }) {
  const { hasPermission } = useAuth();
  const [filters, setFilters] = useState({
    query: "",
    status: "All Statuses",
    tier: "All Tiers",
    risk: "All Risks",
  });
  const apps = buyerVerificationService.getQueue(filters);
  const analytics = buyerVerificationService.getAnalytics();
  const open = (app) => {
    window.localStorage.setItem(SELECTED_APPLICATION_KEY, app.id);
    navigate("admin-verification-detail");
  };
  if (!hasPermission("buyers.view")) return null;
  return (
    <section className="verification-admin-page">
      <header>
        <span className="eyebrow">Buyer verification operations</span>
        <h2>Verification queue</h2>
        <p>
          Human review, supporting evidence, risk, access decisions, and
          reverification.
        </p>
      </header>
      <div className="verification-metrics">
        {[
          ["Total applications", analytics.total],
          ["Under review", analytics.underReview],
          ["Information requested", analytics.informationRequested],
          ["VIP requests", analytics.vipRequests],
          ["Approved", analytics.approved],
          ["Rejected", analytics.rejected],
          ["Reverification", analytics.reverification],
          ["Approval rate", `${analytics.approvalRate}%`],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="verification-admin-filters">
        <input
          aria-label="Search verification applications"
          placeholder="Search name, email, company, or reference"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
        />
        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option>All Statuses</option>
          {VERIFICATION_STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filter by tier"
          value={filters.tier}
          onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
        >
          <option>All Tiers</option>
          <option>Discovery Access</option>
          <option>Professional Buyer</option>
          <option>VIP Sync Access</option>
        </select>
        <select
          aria-label="Filter by risk"
          value={filters.risk}
          onChange={(e) => setFilters({ ...filters, risk: e.target.value })}
        >
          <option>All Risks</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>
      </div>
      <div className="verification-queue-wrap">
        <table>
          <thead>
            <tr>
              <th>Application</th>
              <th>Buyer</th>
              <th>Company</th>
              <th>Requested tier</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Submitted</th>
              <th>Reviewer</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id}>
                <td>
                  <strong>{app.reference}</strong>
                </td>
                <td>
                  {app.buyerName}
                  <small>{app.email}</small>
                </td>
                <td>
                  {app.company}
                  <small>{app.jobTitle}</small>
                </td>
                <td>{app.requestedAccessTier}</td>
                <td>
                  <StatusBadge status={app.status} />
                </td>
                <td>
                  <span
                    className={`risk-badge risk-${app.riskLevel.toLowerCase()}`}
                  >
                    {app.riskLevel}
                  </span>
                </td>
                <td>{formatDate(app.submittedAt)}</td>
                <td>{reviewerName(app.assignedReviewerId)}</td>
                <td>
                  <button onClick={() => open(app)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AdminVerificationDetail({ navigate, showToast }) {
  const { user, hasPermission, refresh } = useAuth();
  const applicationId =
    window.localStorage.getItem(SELECTED_APPLICATION_KEY) ||
    "verification-ethan";
  const [app, setApp] = useState(() =>
    buyerVerificationService.getById(applicationId),
  );
  const [tab, setTab] = useState("Summary");
  const [infoOpen, setInfoOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const reload = (next) => {
    setApp(next || buyerVerificationService.getById(applicationId));
    refresh();
  };
  if (!app)
    return (
      <section className="verification-admin-page">
        <h2>Application not found</h2>
        <button onClick={() => navigate("admin-verifications")}>
          Return to queue
        </button>
      </section>
    );
  const assign = (reviewerId) => {
    const result = buyerVerificationService.assignReviewer(
      app.id,
      reviewerId,
      user,
    );
    if (result.ok) {
      reload(result.application);
      showToast("Reviewer assignment updated.");
    }
  };
  const updateDocument = (doc, status) => {
    const result = buyerVerificationService.updateDocumentStatus(
      app.id,
      doc.id,
      status,
      status === "Replacement Requested"
        ? "Please provide a clearer or more current replacement document."
        : `Document ${status.toLowerCase()}.`,
      `Reviewed by ${user.name}.`,
      user,
    );
    if (result.ok) reload(result.application);
  };
  return (
    <section className="verification-admin-page detail">
      <button
        className="back-to-queue"
        onClick={() => navigate("admin-verifications")}
      >
        ← Verification queue
      </button>
      <header className="verification-detail-head">
        <div>
          <span className="eyebrow">{app.reference}</span>
          <h2>{app.buyerName}</h2>
          <p>
            {app.company} · {app.jobTitle} · {app.email}
          </p>
        </div>
        <div>
          <StatusBadge status={app.status} />
          <span className={`risk-badge risk-${app.riskLevel.toLowerCase()}`}>
            {app.riskLevel} risk
          </span>
        </div>
      </header>
      <div className="review-assignment-bar">
        <label>
          Assigned reviewer
          <select
            value={app.assignedReviewerId || ""}
            onChange={(e) => assign(e.target.value)}
            disabled={!hasPermission("buyers.assign")}
          >
            <option value="">Unassigned</option>
            {REVIEWERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {item.role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Requested tier
          <input value={app.requestedAccessTier} readOnly />
        </label>
        <label>
          Current access
          <input value={app.currentAccessTier} readOnly />
        </label>
        <button
          className="outline-button"
          onClick={() => setInfoOpen(true)}
          disabled={!hasPermission("buyers.request_information")}
        >
          Request Information
        </button>
        <button
          className="gold-button"
          onClick={() => setDecisionOpen(true)}
          disabled={
            !hasPermission("buyers.approve") && !hasPermission("buyers.reject")
          }
        >
          Decision
        </button>
      </div>
      <div className="verification-review-tabs">
        {[
          "Summary",
          "Profile & Company",
          "Usage & Experience",
          "Projects & References",
          "Documents",
          "Risk & Checklist",
          "Notes & Activity",
        ].map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="verification-review-body">
        {tab === "Summary" && <ReviewSummary app={app} />}
        {tab === "Profile & Company" && <ProfileCompanyReview app={app} />}
        {tab === "Usage & Experience" && <UsageExperienceReview app={app} />}
        {tab === "Projects & References" && (
          <ProjectsReferencesReview app={app} user={user} onUpdate={reload} />
        )}
        {tab === "Documents" && (
          <DocumentReview app={app} onUpdate={updateDocument} />
        )}
        {tab === "Risk & Checklist" && (
          <RiskChecklist app={app} user={user} onUpdate={reload} />
        )}
        {tab === "Notes & Activity" && (
          <NotesActivity app={app} user={user} onUpdate={reload} />
        )}
      </div>
      {infoOpen && (
        <InformationRequestModal
          app={app}
          actor={user}
          onClose={() => setInfoOpen(false)}
          onComplete={(next) => {
            reload(next);
            setInfoOpen(false);
            showToast("Additional information requested.");
          }}
        />
      )}
      {decisionOpen && (
        <DecisionModal
          app={app}
          actor={user}
          onClose={() => setDecisionOpen(false)}
          onComplete={(next) => {
            reload(next);
            setDecisionOpen(false);
            showToast(`Verification status changed to ${next.status}.`);
          }}
        />
      )}
    </section>
  );
}

function ReviewSummary({ app }) {
  return (
    <div className="review-section-grid">
      <section>
        <h3>Application summary</h3>
        <dl>
          <dt>Status</dt>
          <dd>{app.status}</dd>
          <dt>Requested tier</dt>
          <dd>{app.requestedAccessTier}</dd>
          <dt>Current access</dt>
          <dd>{app.currentAccessTier}</dd>
          <dt>Submitted</dt>
          <dd>{formatDate(app.submittedAt)}</dd>
          <dt>Reviewer</dt>
          <dd>{reviewerName(app.assignedReviewerId)}</dd>
        </dl>
      </section>
      <section>
        <h3>Verification checks</h3>
        <div className="check-status-grid">
          {Object.entries(app.checks || {}).map(([key, value]) => (
            <span key={key}>
              <strong>{key.replace(/([A-Z])/g, " $1")}</strong>
              <em>{value}</em>
            </span>
          ))}
        </div>
      </section>
      <section>
        <h3>Access recommendation</h3>
        <dl>
          <dt>Secure delivery</dt>
          <dd>{app.secureDeliveryApproved ? "Approved" : "Not approved"}</dd>
          <dt>Master access</dt>
          <dd>{app.masterAccessApproved ? "Approved" : "Not approved"}</dd>
          <dt>Stem access</dt>
          <dd>{app.stemAccessApproved ? "Approved" : "Not approved"}</dd>
          <dt>Pre-approved terms</dt>
          <dd>{app.preApprovedTerms ? "Available" : "Not enabled"}</dd>
        </dl>
        {app.restrictions?.length > 0 && (
          <RestrictionList restrictions={app.restrictions} />
        )}
      </section>
    </div>
  );
}
function ProfileCompanyReview({ app }) {
  const p = app.questionnaire.professional;
  const c = app.questionnaire.company;
  return (
    <div className="review-section-grid">
      <section>
        <h3>Buyer profile</h3>
        <dl>
          {Object.entries(p).map(([key, value]) => (
            <>
              <dt key={`${key}-dt`}>{key.replace(/([A-Z])/g, " $1")}</dt>
              <dd key={`${key}-dd`}>{String(value || "Not provided")}</dd>
            </>
          ))}
        </dl>
      </section>
      <section>
        <h3>Company details</h3>
        <dl>
          {Object.entries(c).map(([key, value]) => (
            <>
              <dt key={`${key}-dt`}>{key.replace(/([A-Z])/g, " $1")}</dt>
              <dd key={`${key}-dd`}>{String(value || "Not provided")}</dd>
            </>
          ))}
        </dl>
      </section>
    </div>
  );
}
function UsageExperienceReview({ app }) {
  return (
    <div className="review-section-grid">
      <section>
        <h3>Intended usage</h3>
        <pre>{JSON.stringify(app.questionnaire.usage, null, 2)}</pre>
      </section>
      <section>
        <h3>Licensing experience</h3>
        <pre>{JSON.stringify(app.questionnaire.experience, null, 2)}</pre>
      </section>
      <section>
        <h3>Requested access</h3>
        <pre>{JSON.stringify(app.questionnaire.access, null, 2)}</pre>
      </section>
    </div>
  );
}
function ProjectsReferencesReview({ app, user, onUpdate }) {
  return (
    <div className="review-section-grid">
      <section>
        <h3>Projects and credits</h3>
        {app.projects.length ? (
          app.projects.map((item) => (
            <article className="review-evidence-card" key={item.id}>
              <strong>{item.name}</strong>
              <span>
                {item.productionCompany} · {item.role} · {item.year}
              </span>
              <p>{item.responsibility}</p>
            </article>
          ))
        ) : (
          <p>No projects supplied.</p>
        )}
      </section>
      <section>
        <h3>Professional references</h3>
        {app.references.length ? (
          app.references.map((item) => (
            <article className="review-evidence-card" key={item.id}>
              <strong>{item.name}</strong>
              <span>
                {item.company} · {item.email}
              </span>
              <select
                aria-label={`Reference status for ${item.name}`}
                value={item.status}
                onChange={(e) => {
                  const result = buyerVerificationService.updateReferenceStatus(
                    app.id,
                    item.id,
                    e.target.value,
                    "Simulated reviewer update",
                    user,
                  );
                  onUpdate(result.application);
                }}
              >
                <option>Not Contacted</option>
                <option>Contact Pending</option>
                <option>Verification Sent</option>
                <option>Verified</option>
                <option>Unable to Verify</option>
                <option>Declined</option>
              </select>
            </article>
          ))
        ) : (
          <p>No references supplied.</p>
        )}
      </section>
    </div>
  );
}
function DocumentReview({ app, onUpdate }) {
  return (
    <div className="document-review-grid">
      {app.documents.length ? (
        app.documents.map((doc) => (
          <article key={doc.id}>
            <FileArrowUp />
            <div>
              <strong>{doc.name}</strong>
              <span>
                {doc.category} · {doc.size}
              </span>
              <StatusBadge status={doc.status} />
            </div>
            <div>
              <button onClick={() => onUpdate(doc, "Accepted")}>Accept</button>
              <button onClick={() => onUpdate(doc, "Rejected")}>Reject</button>
              <button onClick={() => onUpdate(doc, "Replacement Requested")}>
                Request replacement
              </button>
            </div>
            {doc.privateNote && <small>Private note: {doc.privateNote}</small>}
          </article>
        ))
      ) : (
        <p>No documents supplied.</p>
      )}
    </div>
  );
}
function RiskChecklist({ app, user, onUpdate }) {
  const [risk, setRisk] = useState(app.riskLevel);
  const [factors, setFactors] = useState(app.riskFactors.join("\n"));
  const [signals, setSignals] = useState(app.positiveSignals.join("\n"));
  const [rationale, setRationale] = useState("");
  const checklistItems = [
    "Identity reviewed",
    "Company reviewed",
    "Professional role reviewed",
    "Intended use reviewed",
    "Credits reviewed",
    "References reviewed",
    "Documents reviewed",
    "Risk assessment complete",
    "Requested tier appropriate",
    "Secure-delivery eligibility reviewed",
    "Master access eligibility reviewed",
    "Stem access eligibility reviewed",
    "Pre-approved terms reviewed",
    "Final decision ready",
  ];
  return (
    <div className="review-section-grid">
      <section>
        <h3>Risk assessment</h3>
        <label>
          Manual risk level
          <select value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </label>
        <label>
          Risk factors
          <textarea
            value={factors}
            onChange={(e) => setFactors(e.target.value)}
          />
        </label>
        <label>
          Positive signals
          <textarea
            value={signals}
            onChange={(e) => setSignals(e.target.value)}
          />
        </label>
        <label>
          Internal rationale
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
          />
        </label>
        <button
          className="outline-button"
          onClick={() => {
            const result = buyerVerificationService.updateRisk(
              app.id,
              risk,
              factors.split("\n").filter(Boolean),
              signals.split("\n").filter(Boolean),
              rationale || "Risk assessment updated.",
              user,
            );
            onUpdate(result.application);
          }}
        >
          Save risk assessment
        </button>
      </section>
      <section>
        <h3>Reviewer checklist</h3>
        <div className="reviewer-checklist">
          {checklistItems.map((item) => (
            <label key={item}>
              <input
                type="checkbox"
                checked={Boolean(app.checklist[item])}
                onChange={(e) => {
                  const result = buyerVerificationService.updateChecklist(
                    app.id,
                    item,
                    e.target.checked,
                    user,
                  );
                  onUpdate(result.application);
                }}
              />
              {item}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
function NotesActivity({ app }) {
  return (
    <div className="review-section-grid">
      <section>
        <h3>Internal notes</h3>
        {app.internalNotes.map((note) => (
          <article className="internal-note" key={note.id}>
            <strong>
              {note.type} · {note.visibility}
            </strong>
            <p>{note.content}</p>
            <small>
              {note.author} · {formatDate(note.timestamp)}
            </small>
          </article>
        ))}
      </section>
      <section>
        <h3>Activity history</h3>
        {app.activity.map((event) => (
          <article className="activity-event" key={event.id}>
            <span />
            <div>
              <strong>{event.action}</strong>
              <p>{event.description}</p>
              <small>
                {event.actor} · {new Date(event.timestamp).toLocaleString()}
              </small>
            </div>
            <StatusBadge status={event.status} />
          </article>
        ))}
      </section>
    </div>
  );
}

function InformationRequestModal({ app, actor, onClose, onComplete }) {
  const [title, setTitle] = useState(
    "Additional professional information required",
  );
  const [fields, setFields] = useState(
    "Recent production credit\nClient or agency reference",
  );
  const [documents, setDocuments] = useState("Production credit evidence");
  const [buyerExplanation, setBuyerExplanation] = useState(
    "Please provide the listed items so we can complete your professional verification.",
  );
  const [internalNotes, setInternalNotes] = useState("");
  const [dueDate, setDueDate] = useState("2026-07-29");
  const [error, setError] = useState("");
  const submit = () => {
    const result = buyerVerificationService.requestInformation(
      app.id,
      {
        title,
        fields: fields.split("\n").filter(Boolean),
        documents: documents.split("\n").filter(Boolean),
        buyerExplanation,
        internalNotes,
        dueDate,
        priority: "High",
      },
      actor,
    );
    if (!result.ok) setError(result.message);
    else onComplete(result.application);
  };
  return (
    <div
      className="verification-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-request-title"
    >
      <div className="verification-modal">
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <h3 id="info-request-title">Request additional information</h3>
        {error && (
          <div className="verification-error" role="alert">
            {error}
          </div>
        )}
        <div className="verification-form-grid">
          <Field label="Request title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          <Field label="Requested fields (one per line)">
            <textarea
              value={fields}
              onChange={(e) => setFields(e.target.value)}
            />
          </Field>
          <Field label="Requested documents">
            <textarea
              value={documents}
              onChange={(e) => setDocuments(e.target.value)}
            />
          </Field>
          <Field label="Buyer-facing explanation">
            <textarea
              value={buyerExplanation}
              onChange={(e) => setBuyerExplanation(e.target.value)}
            />
          </Field>
          <Field label="Internal notes">
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            />
          </Field>
        </div>
        <div className="modal-actions">
          <button className="outline-button" onClick={onClose}>
            Cancel
          </button>
          <button className="gold-button" onClick={submit}>
            Send request
          </button>
        </div>
      </div>
    </div>
  );
}
function DecisionModal({ app, actor, onClose, onComplete }) {
  const initialStatus =
    app.status === "Suspended"
      ? "Reinstated"
      : ["Approved", "Approved with Restrictions", "Reinstated"].includes(
            app.status,
          )
        ? "Reverification Required"
        : "Approved";
  const [status, setStatus] = useState(initialStatus);
  const [tier, setTier] = useState(app.requestedAccessTier);
  const [buyerMessage, setBuyerMessage] = useState(
    initialStatus === "Reinstated"
      ? "Your professional buyer access has been restored."
      : initialStatus === "Reverification Required"
        ? "Please provide updated professional and company information to maintain your access."
        : "Your professional buyer access has been approved.",
  );
  const [internalRationale, setInternalRationale] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [secure, setSecure] = useState(true);
  const [masters, setMasters] = useState(false);
  const [stems, setStems] = useState(false);
  const [terms, setTerms] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [error, setError] = useState("");
  const decide = () => {
    const payload = {
      status,
      approvedTier: status === "Rejected" ? "Discovery Access" : tier,
      restrictions: restrictions.split("\n").filter(Boolean),
      buyerMessage,
      internalRationale,
      secureDeliveryApproved: secure,
      masterAccessApproved: masters,
      stemAccessApproved: stems,
      preApprovedTerms: terms,
      nextReviewAt: status.startsWith("Approved")
        ? "2027-07-16T00:00:00.000Z"
        : null,
      overrideReason,
    };
    const result =
      status === "Reinstated"
        ? buyerVerificationService.reinstate(app.id, tier, buyerMessage, actor)
        : status === "Reverification Required"
          ? buyerVerificationService.triggerReverification(
              app.id,
              {
                title: "Buyer reverification required",
                fields: ["Updated professional and company information"],
                documents: [],
                buyerExplanation: buyerMessage,
                internalNotes: internalRationale,
                dueDate: "2026-07-29",
                priority: "High",
              },
              actor,
            )
          : buyerVerificationService.decide(app.id, payload, actor);
    if (!result.ok) setError(result.message);
    else onComplete(result.application);
  };
  return (
    <div
      className="verification-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-title"
    >
      <div className="verification-modal">
        <button className="modal-x" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <h3 id="decision-title">Verification decision</h3>
        {error && (
          <div className="verification-error" role="alert">
            {error}
          </div>
        )}
        <div className="verification-form-grid">
          <Field label="Decision">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Approved</option>
              <option>Approved with Restrictions</option>
              <option>Rejected</option>
              <option>Suspended</option>
              {app.status === "Suspended" && <option>Reinstated</option>}
              {[
                "Approved",
                "Approved with Restrictions",
                "Reinstated",
              ].includes(app.status) && (
                <option>Reverification Required</option>
              )}
            </select>
          </Field>
          <Field label="Approved tier">
            <select value={tier} onChange={(e) => setTier(e.target.value)}>
              <option>Discovery Access</option>
              <option>Professional Buyer</option>
              <option>VIP Sync Access</option>
            </select>
          </Field>
          <Field label="Buyer-facing message">
            <textarea
              value={buyerMessage}
              onChange={(e) => setBuyerMessage(e.target.value)}
            />
          </Field>
          <Field label="Internal rationale">
            <textarea
              value={internalRationale}
              onChange={(e) => setInternalRationale(e.target.value)}
            />
          </Field>
          <Field label="Restrictions (one per line)">
            <textarea
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
            />
          </Field>
          <Field label="Super-admin override reason">
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Required if the checklist is incomplete."
            />
          </Field>
        </div>
        <div className="verification-checkbox-grid">
          <label>
            <input
              type="checkbox"
              checked={secure}
              onChange={(e) => setSecure(e.target.checked)}
            />
            Secure delivery
          </label>
          <label>
            <input
              type="checkbox"
              checked={masters}
              onChange={(e) => setMasters(e.target.checked)}
            />
            Master access
          </label>
          <label>
            <input
              type="checkbox"
              checked={stems}
              onChange={(e) => setStems(e.target.checked)}
            />
            Stem access
          </label>
          <label>
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            Pre-approved terms
          </label>
        </div>
        <div className="modal-actions">
          <button className="outline-button" onClick={onClose}>
            Cancel
          </button>
          <button className="gold-button" onClick={decide}>
            Apply decision
          </button>
        </div>
      </div>
    </div>
  );
}

export function renderVerificationView(view, props) {
  if (view === "buyer-verification")
    return <BuyerVerificationPage {...props} />;
  if (view === "admin-verifications")
    return <AdminVerificationQueue {...props} />;
  if (view === "admin-verification-detail")
    return <AdminVerificationDetail {...props} />;
  return null;
}
