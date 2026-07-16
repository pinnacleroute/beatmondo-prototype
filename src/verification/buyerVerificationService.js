import { readAuthState, writeAuthState } from "../auth/authService.js";
import { ROLE_PERMISSIONS } from "../auth/mockAuthData.js";
import {
  BUYER_VERIFICATION_STORAGE_KEY,
  DEFAULT_VERIFICATION_STATE,
  REVIEWERS,
  STATUS_TRANSITIONS,
} from "./buyerVerificationData.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const wait = (ms = 360) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));
const now = () => new Date().toISOString();
const id = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function safeState() {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(BUYER_VERIFICATION_STORAGE_KEY),
    );
    if (parsed?.applications && Array.isArray(parsed.applications))
      return parsed;
  } catch {
    /* restore defaults below */
  }
  const state = clone(DEFAULT_VERIFICATION_STATE);
  window.localStorage.setItem(
    BUYER_VERIFICATION_STORAGE_KEY,
    JSON.stringify(state),
  );
  return state;
}

function write(state) {
  window.localStorage.setItem(
    BUYER_VERIFICATION_STORAGE_KEY,
    JSON.stringify(state),
  );
  return state;
}
function mutate(callback) {
  const state = safeState();
  const result = callback(state);
  write(state);
  return result;
}
function actorName(actor) {
  return actor?.name || "beatmondo system";
}
function addActivity(
  app,
  actor,
  action,
  status,
  description,
  before = null,
  after = null,
) {
  app.activity.unshift({
    id: id("activity"),
    actor: actorName(actor),
    action,
    timestamp: now(),
    application: app.reference,
    buyer: app.buyerName,
    status,
    description,
    before,
    after,
  });
}

function addAuthMessage(userId, title, body, action = "buyer-verification") {
  const auth = readAuthState();
  auth.messages.unshift({
    id: id("verification-message"),
    userId,
    type: "verification",
    title,
    body,
    createdAt: now(),
    read: false,
    action,
  });
  writeAuthState(auth);
}

function syncUserEntitlements(app, tier, status, options = {}) {
  const auth = readAuthState();
  const user = auth.users.find((item) => item.id === app.userId);
  if (!user) return;
  if (
    status === "Approved" ||
    status === "Approved with Restrictions" ||
    status === "Reinstated"
  ) {
    const role =
      tier === "VIP Sync Access"
        ? "vip_buyer"
        : tier === "Professional Buyer"
          ? "professional_buyer"
          : "discovery_buyer";
    user.role = role;
    user.roleLabel = tier === "VIP Sync Access" ? "VIP Buyer" : tier;
    user.membershipTier = tier;
    user.permissions = ROLE_PERMISSIONS[role];
    user.verificationStatus = "approved";
    user.preApprovedTerms = Boolean(options.preApprovedTerms);
  } else if (
    ["Suspended", "Rejected", "Reverification Required"].includes(status)
  ) {
    user.membershipTier = "Discovery Access";
    user.permissions = ROLE_PERMISSIONS.discovery_buyer;
    user.verificationStatus = status.toLowerCase().replaceAll(" ", "_");
    user.preApprovedTerms = false;
  } else user.verificationStatus = status.toLowerCase().replaceAll(" ", "_");
  writeAuthState(auth);
}

export function canTransitionVerificationStatus(
  current,
  next,
  permissions = [],
) {
  if (permissions.includes("*")) return true;
  if (!(STATUS_TRANSITIONS[current] || []).includes(next)) return false;
  if (["Approved", "Approved with Restrictions"].includes(next))
    return permissions.includes("buyers.approve");
  if (next === "Rejected") return permissions.includes("buyers.reject");
  if (next === "Suspended") return permissions.includes("buyers.suspend");
  return true;
}

export const buyerVerificationService = {
  getState: safeState,
  resetDemoData() {
    const state = clone(DEFAULT_VERIFICATION_STATE);
    write(state);
    return state;
  },
  getByUser(userId) {
    const updatedAt = (app) =>
      app.activity?.[0]?.timestamp || app.lastSavedAt || app.submittedAt || "";
    return (
      safeState()
        .applications.filter((app) => app.userId === userId)
        .sort((a, b) =>
          String(updatedAt(b)).localeCompare(String(updatedAt(a))),
        )[0] || null
    );
  },
  getById(applicationId) {
    return (
      safeState().applications.find((app) => app.id === applicationId) || null
    );
  },
  getQueue(filters = {}) {
    let apps = safeState().applications;
    const query = String(filters.query || "").toLowerCase();
    if (query)
      apps = apps.filter((app) =>
        `${app.reference} ${app.buyerName} ${app.email} ${app.company}`
          .toLowerCase()
          .includes(query),
      );
    if (filters.status && filters.status !== "All Statuses")
      apps = apps.filter((app) => app.status === filters.status);
    if (filters.tier && filters.tier !== "All Tiers")
      apps = apps.filter((app) => app.requestedAccessTier === filters.tier);
    if (filters.risk && filters.risk !== "All Risks")
      apps = apps.filter((app) => app.riskLevel === filters.risk);
    return clone(apps);
  },
  getAnalytics() {
    const apps = safeState().applications;
    const decided = apps.filter((app) =>
      ["Approved", "Approved with Restrictions", "Rejected"].includes(
        app.status,
      ),
    );
    const approved = decided.filter((app) =>
      app.status.startsWith("Approved"),
    ).length;
    return {
      total: apps.length,
      underReview: apps.filter((app) =>
        ["Submitted", "Initial Review", "Under Review", "Resubmitted"].includes(
          app.status,
        ),
      ).length,
      informationRequested: apps.filter(
        (app) => app.status === "Additional Information Required",
      ).length,
      vipRequests: apps.filter(
        (app) => app.requestedAccessTier === "VIP Sync Access",
      ).length,
      approved,
      rejected: decided.length - approved,
      approvalRate: decided.length
        ? Math.round((approved / decided.length) * 100)
        : 0,
      reverification: apps.filter((app) =>
        ["Reverification Required", "Suspended"].includes(app.status),
      ).length,
    };
  },
  async createDraft(user) {
    await wait();
    const existing = this.getByUser(user.id);
    if (existing && !["Rejected", "Withdrawn"].includes(existing.status))
      return {
        ok: false,
        message: "An active verification application already exists.",
        application: existing,
      };
    return mutate((state) => {
      state.lastReference += 1;
      const application = {
        id: id("verification"),
        reference: `BM-BV-2026-${String(state.lastReference).padStart(4, "0")}`,
        userId: user.id,
        organizationId: user.organizationId,
        buyerName: user.name,
        email: user.email,
        company: user.organization,
        jobTitle: user.jobTitle,
        requestedAccessTier: "Professional Buyer",
        currentAccessTier: user.membershipTier || "Discovery Access",
        status: "Draft",
        riskLevel: "Medium",
        progressStep: 1,
        lastSavedAt: now(),
        submittedAt: null,
        assignedReviewerId: null,
        checks: {},
        secureDeliveryApproved: false,
        masterAccessApproved: false,
        stemAccessApproved: false,
        preApprovedTerms: false,
        questionnaire: {
          professional: {
            legalName: user.name,
            preferredName: user.name.split(" ")[0],
            workEmail: user.email,
            phone: user.phone || "",
            country: user.country || "",
            timezone: "America/New_York",
            jobTitle: user.jobTitle,
            department: "",
            role: user.jobTitle || "Creative Producer",
            linkedin: "",
            portfolio: user.website || "",
            yearsExperience: "1–4",
          },
          company: {
            legalName: user.organization,
            tradingName: "",
            website: user.website || "",
            emailDomain: user.email.split("@")[1],
            type: "Production company",
            size: "1–10",
            headquarters: user.country || "",
            address: "",
            activity: "",
            established: "",
            registrationNumber: "",
            linkedin: "",
            parentCompany: "",
          },
          usage: {
            projectTypes: [],
            media: [],
            territories: [],
            term: "1 Year",
            frequency: "Occasional",
            annualVolume: "1–5 licences",
            budget: "$5k–$10k",
            masters: false,
            stems: false,
            instrumentals: true,
            cleanVersions: false,
            rush: false,
            concierge: false,
            preApprovedTerms: false,
            firstProject: "",
          },
          experience: {
            licensedBefore: false,
            licenceCount: "0",
            typicalValue: "",
            publishers: false,
            masterOwners: false,
            cueSheets: false,
            negotiations: false,
            libraries: false,
            secureAssets: false,
            terms: "",
            relationships: "",
          },
          access: {
            requestedTier: "Professional Buyer",
            vipReason: "",
            expectedVolume: "1–5 licences",
            urgency: "Standard",
            premiumAssets: "",
            concierge: false,
          },
          declaration: {
            accurate: false,
            authorized: false,
            mayVerify: false,
            revocable: false,
            terms: false,
            assetApproval: false,
            acceptedAt: null,
            termsVersion: "2026.07",
          },
        },
        projects: [],
        references: [],
        documents: [],
        internalNotes: [],
        buyerVisibleMessages: [],
        riskFactors: [],
        positiveSignals: [],
        restrictions: [],
        informationRequests: [],
        checklist: {},
        activity: [],
        decision: null,
      };
      addActivity(
        application,
        user,
        "Draft created",
        "Draft",
        "Buyer verification draft created.",
      );
      state.applications.push(application);
      return { ok: true, application: clone(application) };
    });
  },
  saveStep(applicationId, step, section, values, actor) {
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      if (
        !app ||
        ![
          "Draft",
          "Additional Information Required",
          "Reverification Required",
        ].includes(app.status)
      )
        return { ok: false, message: "This application is locked for review." };
      app.questionnaire[section] = { ...app.questionnaire[section], ...values };
      app.progressStep = Math.max(app.progressStep || 1, step);
      app.lastSavedAt = now();
      addActivity(
        app,
        actor,
        "Step completed",
        app.status,
        `${section} information saved.`,
      );
      return { ok: true, application: clone(app) };
    });
  },
  addProject(applicationId, project, actor) {
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      if (!app) return { ok: false };
      const value = { id: id("project"), ...project };
      app.projects.push(value);
      addActivity(
        app,
        actor,
        "Project added",
        app.status,
        `${project.name} added to professional credits.`,
      );
      return { ok: true, application: clone(app) };
    });
  },
  removeProject(applicationId, projectId) {
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      if (!app) return { ok: false };
      app.projects = app.projects.filter((item) => item.id !== projectId);
      return { ok: true, application: clone(app) };
    });
  },
  addReference(applicationId, reference, actor) {
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      if (!app) return { ok: false };
      app.references.push({
        id: id("reference"),
        status: "Not Contacted",
        ...reference,
      });
      addActivity(
        app,
        actor,
        "Reference added",
        app.status,
        `${reference.name} added as a professional reference.`,
      );
      return { ok: true, application: clone(app) };
    });
  },
  uploadDocument(applicationId, file, category, actor) {
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      if (!app) return { ok: false };
      const document = {
        id: id("document"),
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        type: file.type || file.name.split(".").pop(),
        category,
        uploadedAt: now(),
        uploadedBy: actorName(actor),
        status: "Uploaded",
        preview: "Prototype metadata preview only",
      };
      app.documents.push(document);
      addActivity(
        app,
        actor,
        "Document uploaded",
        app.status,
        `${document.name} uploaded as ${category}.`,
      );
      return { ok: true, application: clone(app) };
    });
  },
  removeDocument(applicationId, documentId) {
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      if (
        !app ||
        !["Draft", "Additional Information Required"].includes(app.status)
      )
        return { ok: false, message: "Submitted documents are locked." };
      app.documents = app.documents.filter((item) => item.id !== documentId);
      return { ok: true, application: clone(app) };
    });
  },
  async submitApplication(applicationId, actor) {
    await wait(500);
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      if (!app || app.status !== "Draft")
        return {
          ok: false,
          message: "Only a draft application can be submitted.",
        };
      const q = app.questionnaire;
      if (
        !q.professional.legalName ||
        !q.company.legalName ||
        !q.usage.projectTypes?.length ||
        !q.declaration.accurate ||
        !q.declaration.terms
      )
        return {
          ok: false,
          message:
            "Complete required professional, company, usage, and declaration information.",
        };
      if (
        q.access.requestedTier !== "Discovery Access" &&
        !app.projects.length &&
        !q.experience.projectExplanation
      )
        return {
          ok: false,
          message:
            "Add at least one professional project or provide a project-context explanation.",
        };
      if (q.access.requestedTier === "VIP Sync Access" && !q.access.vipReason)
        return {
          ok: false,
          message: "Explain why VIP Sync Access is required.",
        };
      app.status = "Submitted";
      app.submittedAt = now();
      app.progressStep = 10;
      app.requestedAccessTier = q.access.requestedTier;
      q.declaration.acceptedAt = now();
      addActivity(
        app,
        actor,
        "Application submitted",
        "Submitted",
        "Buyer verification application submitted for human review.",
      );
      addAuthMessage(
        app.userId,
        "Buyer verification application received",
        `${app.reference} was submitted successfully.`,
      );
      return { ok: true, application: clone(app) };
    });
  },
  withdraw(applicationId, actor, reason = "") {
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      if (
        !app ||
        ![
          "Draft",
          "Submitted",
          "Initial Review",
          "Under Review",
          "Additional Information Required",
        ].includes(app.status)
      )
        return {
          ok: false,
          message: "This application can no longer be withdrawn.",
        };
      const before = app.status;
      app.status = "Withdrawn";
      addActivity(
        app,
        actor,
        "Application withdrawn",
        "Withdrawn",
        reason || "Buyer withdrew the application.",
        before,
        "Withdrawn",
      );
      return { ok: true, application: clone(app) };
    });
  },
  submitAdditionalInformation(applicationId, response, actor) {
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      if (
        !app ||
        ![
          "Additional Information Required",
          "Reverification Required",
          "Suspended",
        ].includes(app.status)
      )
        return {
          ok: false,
          message: "No additional information request is active.",
        };
      app.informationRequests
        .filter((item) => item.status === "Open")
        .forEach((item) => {
          item.status = "Response Submitted";
          item.response = response;
          item.respondedAt = now();
        });
      app.status = "Resubmitted";
      addActivity(
        app,
        actor,
        "Buyer response submitted",
        "Resubmitted",
        "Buyer submitted requested verification information.",
      );
      addAuthMessage(
        app.userId,
        "Verification response received",
        "Your additional information was sent to the assigned reviewer.",
      );
      return { ok: true, application: clone(app) };
    });
  },
  assignReviewer(applicationId, reviewerId, actor) {
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      const reviewer = REVIEWERS.find((item) => item.id === reviewerId);
      if (!app || !reviewer) return { ok: false };
      app.assignedReviewerId = reviewerId;
      if (["Submitted", "Initial Review"].includes(app.status))
        app.status = "Under Review";
      addActivity(
        app,
        actor,
        "Reviewer assigned",
        app.status,
        `${reviewer.name} assigned to the application.`,
      );
      return { ok: true, application: clone(app) };
    });
  },
  updateRisk(
    applicationId,
    riskLevel,
    factors,
    positiveSignals,
    rationale,
    actor,
  ) {
    return mutate((state) => {
      const app = state.applications.find((item) => item.id === applicationId);
      if (!app) return { ok: false };
      const before = app.riskLevel;
      app.riskLevel = riskLevel;
      app.riskFactors = factors;
      app.positiveSignals = positiveSignals;
      app.internalNotes.unshift({
        id: id("note"),
        author: actorName(actor),
        timestamp: now(),
        type: "Risk",
        visibility: "Internal Only",
        content: rationale,
      });
      addActivity(
        app,
        actor,
        "Risk level changed",
        app.status,
        `Risk updated from ${before} to ${riskLevel}.`,
        before,
        riskLevel,
      );
      return { ok: true, application: clone(app) };
    });
  },
  updateChecklist(applicationId, item, checked, actor) {
    return mutate((state) => {
      const app = state.applications.find(
        (entry) => entry.id === applicationId,
      );
      if (!app) return { ok: false };
      app.checklist[item] = checked;
      addActivity(
        app,
        actor,
        "Reviewer checklist updated",
        app.status,
        `${item}: ${checked ? "complete" : "incomplete"}.`,
      );
      return { ok: true, application: clone(app) };
    });
  },
  updateDocumentStatus(
    applicationId,
    documentId,
    status,
    buyerMessage,
    privateNote,
    actor,
  ) {
    return mutate((state) => {
      const app = state.applications.find(
        (entry) => entry.id === applicationId,
      );
      const document = app?.documents.find((entry) => entry.id === documentId);
      if (!app || !document) return { ok: false };
      document.status = status;
      document.buyerMessage = buyerMessage;
      document.privateNote = privateNote;
      if (buyerMessage)
        app.buyerVisibleMessages.unshift({
          id: id("message"),
          title: `Document ${status.toLowerCase()}`,
          body: buyerMessage,
          createdAt: now(),
        });
      addActivity(
        app,
        actor,
        `Document ${status.toLowerCase()}`,
        app.status,
        `${document.name} marked ${status}.`,
      );
      return { ok: true, application: clone(app) };
    });
  },
  updateReferenceStatus(applicationId, referenceId, status, note, actor) {
    return mutate((state) => {
      const app = state.applications.find(
        (entry) => entry.id === applicationId,
      );
      const reference = app?.references.find(
        (entry) => entry.id === referenceId,
      );
      if (!app || !reference) return { ok: false };
      reference.status = status;
      reference.reviewNote = note;
      addActivity(
        app,
        actor,
        "Reference updated",
        app.status,
        `${reference.name}: ${status}.`,
      );
      return { ok: true, application: clone(app) };
    });
  },
  requestInformation(applicationId, request, actor) {
    return mutate((state) => {
      const app = state.applications.find(
        (entry) => entry.id === applicationId,
      );
      if (
        !app ||
        ![
          "Submitted",
          "Initial Review",
          "Under Review",
          "Resubmitted",
        ].includes(app.status)
      )
        return {
          ok: false,
          message: "Information cannot be requested from the current status.",
        };
      app.status = "Additional Information Required";
      app.informationRequests.unshift({
        id: id("information"),
        ...request,
        reviewer: actorName(actor),
        sentAt: now(),
        status: "Open",
      });
      app.buyerVisibleMessages.unshift({
        id: id("message"),
        title: request.title,
        body: request.buyerExplanation,
        createdAt: now(),
      });
      app.internalNotes.unshift({
        id: id("note"),
        author: actorName(actor),
        timestamp: now(),
        type: "Information request",
        visibility: "Internal Only",
        content: request.internalNotes,
      });
      addActivity(
        app,
        actor,
        "Information requested",
        app.status,
        request.buyerExplanation,
      );
      addAuthMessage(
        app.userId,
        "Additional verification information required",
        request.buyerExplanation,
      );
      syncUserEntitlements(app, "Discovery Access", app.status);
      return { ok: true, application: clone(app) };
    });
  },
  decide(applicationId, decision, actor) {
    return mutate((state) => {
      const app = state.applications.find(
        (entry) => entry.id === applicationId,
      );
      if (!app) return { ok: false, message: "Application not found." };
      const permissions = actor?.permissions || [];
      const next = decision.status;
      if (!canTransitionVerificationStatus(app.status, next, permissions))
        return {
          ok: false,
          message: `Transition from ${app.status} to ${next} is not permitted.`,
        };
      if (
        decision.approvedTier === "VIP Sync Access" &&
        !permissions.includes("*") &&
        !permissions.includes("buyers.manage_vip")
      )
        return {
          ok: false,
          message: "VIP approval requires a senior approver.",
        };
      const required = [
        "Identity reviewed",
        "Company reviewed",
        "Professional role reviewed",
        "Intended use reviewed",
        "Risk assessment complete",
        "Final decision ready",
      ];
      const incomplete = required.filter((item) => !app.checklist[item]);
      if (
        next.startsWith("Approved") &&
        incomplete.length &&
        !decision.overrideReason
      )
        return {
          ok: false,
          message: `Complete the reviewer checklist: ${incomplete.join(", ")}.`,
        };
      const before = app.status;
      app.status = next;
      app.currentAccessTier = decision.approvedTier || "Discovery Access";
      app.restrictions = decision.restrictions || [];
      app.secureDeliveryApproved = Boolean(decision.secureDeliveryApproved);
      app.masterAccessApproved = Boolean(decision.masterAccessApproved);
      app.stemAccessApproved = Boolean(decision.stemAccessApproved);
      app.preApprovedTerms = Boolean(decision.preApprovedTerms);
      app.decisionAt = now();
      app.nextReviewAt = decision.nextReviewAt || null;
      app.decision = {
        ...decision,
        approver: actorName(actor),
        effectiveAt: now(),
        approvalReference: next.startsWith("Approved")
          ? `BM-APP-${Date.now().toString().slice(-8)}`
          : null,
      };
      app.buyerVisibleMessages.unshift({
        id: id("message"),
        title: `Verification ${next.toLowerCase()}`,
        body: decision.buyerMessage,
        createdAt: now(),
      });
      app.internalNotes.unshift({
        id: id("note"),
        author: actorName(actor),
        timestamp: now(),
        type: "Decision",
        visibility: "Internal Only",
        content: decision.internalRationale,
      });
      addActivity(
        app,
        actor,
        next === "Rejected"
          ? "Buyer rejected"
          : next === "Suspended"
            ? "Buyer suspended"
            : "Buyer approved",
        next,
        decision.buyerMessage,
        before,
        next,
      );
      syncUserEntitlements(app, app.currentAccessTier, next, decision);
      addAuthMessage(
        app.userId,
        `Buyer verification ${next.toLowerCase()}`,
        decision.buyerMessage,
      );
      return { ok: true, application: clone(app) };
    });
  },
  reinstate(applicationId, tier, note, actor) {
    return mutate((state) => {
      const app = state.applications.find(
        (entry) => entry.id === applicationId,
      );
      if (!app || app.status !== "Suspended")
        return {
          ok: false,
          message: "Only suspended access can be reinstated.",
        };
      app.status = "Reinstated";
      app.currentAccessTier = tier;
      app.restrictions = [];
      app.secureDeliveryApproved = tier !== "Discovery Access";
      addActivity(
        app,
        actor,
        "Buyer reinstated",
        "Reinstated",
        note,
        "Suspended",
        "Reinstated",
      );
      syncUserEntitlements(app, tier, "Reinstated", app);
      addAuthMessage(app.userId, "Professional access restored", note);
      return { ok: true, application: clone(app) };
    });
  },
  triggerReverification(applicationId, request, actor) {
    return mutate((state) => {
      const app = state.applications.find(
        (entry) => entry.id === applicationId,
      );
      if (
        !app ||
        !["Approved", "Approved with Restrictions", "Reinstated"].includes(
          app.status,
        )
      )
        return {
          ok: false,
          message: "Reverification can only be triggered for approved access.",
        };
      app.status = "Reverification Required";
      app.informationRequests.unshift({
        id: id("reverify"),
        ...request,
        reviewer: actorName(actor),
        sentAt: now(),
        status: "Open",
      });
      addActivity(
        app,
        actor,
        "Reverification triggered",
        app.status,
        request.buyerExplanation,
      );
      syncUserEntitlements(app, "Discovery Access", app.status);
      addAuthMessage(
        app.userId,
        "Reverification required",
        request.buyerExplanation,
      );
      return { ok: true, application: clone(app) };
    });
  },
};
