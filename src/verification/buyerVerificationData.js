export const BUYER_VERIFICATION_STORAGE_KEY = "beatmondo-buyer-verification-v1";

export const VERIFICATION_STATUSES = [
  "Not Started", "Draft", "Submitted", "Initial Review", "Under Review", "Additional Information Required",
  "Resubmitted", "Escalated", "Approved", "Approved with Restrictions", "Rejected", "Withdrawn", "Expired",
  "Reverification Required", "Suspended", "Reinstated",
];

export const SUB_STATUSES = ["Not Provided", "Pending", "Under Review", "Verified", "Partially Verified", "Additional Information Required", "Failed", "Not Applicable", "Expired"];

export const REVIEWERS = [
  { id: "reviewer-maya", name: "Maya Thompson", role: "Buyer Verification Manager" },
  { id: "user-preston", name: "Preston Repenning", role: "Senior Approver" },
  { id: "reviewer-jordan", name: "Jordan Lee", role: "Licensing Operations" },
  { id: "reviewer-amelia", name: "Amelia Grant", role: "Rights and Compliance" },
];

export const STATUS_TRANSITIONS = {
  "Not Started": ["Draft"], Draft: ["Submitted", "Withdrawn"], Submitted: ["Initial Review", "Withdrawn"],
  "Initial Review": ["Under Review", "Additional Information Required", "Escalated"],
  "Under Review": ["Additional Information Required", "Approved", "Approved with Restrictions", "Rejected", "Escalated", "Withdrawn"],
  "Additional Information Required": ["Resubmitted", "Withdrawn"], Resubmitted: ["Under Review", "Additional Information Required"],
  Escalated: ["Approved", "Approved with Restrictions", "Rejected"], Approved: ["Reverification Required", "Suspended"],
  "Approved with Restrictions": ["Reverification Required", "Suspended"], "Reverification Required": ["Under Review", "Suspended"],
  Suspended: ["Reinstated", "Reverification Required"], Reinstated: ["Approved", "Approved with Restrictions"],
  Rejected: ["Draft"], Withdrawn: ["Draft"],
};

export const VERIFICATION_CONTENT = {
  introduction: "Professional verification protects private catalog intelligence, licensing workflows, and controlled master delivery.",
  reviewGuidance: "Usually reviewed within 2–3 business days. Complex or VIP applications may require additional human review.",
  privacy: "Submitted information is used only for buyer verification, licensing operations, platform security, and approved communications in this prototype.",
  approved: "Your professional buyer access has been approved.",
  rejected: "We could not approve professional buyer access based on the information currently available.",
  suspended: "Your professional buyer access is temporarily restricted.",
};

const checks = (value = "Pending") => ({
  emailDomain: value, identity: value, company: value, role: value, website: value,
  references: value, credits: value, licensingHistory: value, intendedUsage: value, documents: value,
  secureDelivery: value, masterAccess: value, stemAccess: value, preApprovedTerms: value,
});

const baseQuestionnaire = {
  professional: { legalName: "", preferredName: "", phone: "", country: "United States", timezone: "America/New_York", department: "Music", role: "Music Supervisor", linkedin: "", portfolio: "", yearsExperience: "5–10" },
  company: { legalName: "", tradingName: "", website: "", emailDomain: "", type: "Production company", size: "11–50", headquarters: "United States", address: "", activity: "Film and branded production", established: "", registrationNumber: "", linkedin: "", parentCompany: "" },
  usage: { projectTypes: ["Feature film"], media: ["All media"], territories: ["Global"], term: "1 Year", frequency: "Monthly", annualVolume: "6–12 licences", budget: "$10k–$25k", masters: true, stems: false, instrumentals: true, cleanVersions: false, rush: false, concierge: false, preApprovedTerms: false, firstProject: "" },
  experience: { licensedBefore: true, licenceCount: "6–20", typicalValue: "$10k–$25k", publishers: true, masterOwners: true, cueSheets: true, negotiations: true, libraries: true, secureAssets: false, terms: "Project-specific", relationships: "" },
  access: { requestedTier: "Professional Buyer", vipReason: "", expectedVolume: "6–12 licences", urgency: "Standard", premiumAssets: "WAV masters", concierge: false },
  declaration: { accurate: false, authorized: false, mayVerify: false, revocable: false, terms: false, assetApproval: false, acceptedAt: null, termsVersion: "2026.07" },
};

function activity(id, actor, action, status, description, timestamp) {
  return { id, actor, action, timestamp, application: null, buyer: null, status, description };
}

export const DEFAULT_VERIFICATIONS = [
  {
    id: "verification-olivia", reference: "BM-BV-2026-0007", userId: "user-olivia", organizationId: "org-northstar",
    buyerName: "Olivia Bennett", email: "olivia@northstarpictures.com", company: "Northstar Pictures", jobTitle: "Senior Music Supervisor",
    requestedAccessTier: "VIP Sync Access", currentAccessTier: "VIP Sync Access", status: "Approved", riskLevel: "Low", progressStep: 10,
    submittedAt: "2026-06-10T10:00:00.000Z", assignedReviewerId: "user-preston", reviewStartedAt: "2026-06-11T09:00:00.000Z", reviewedAt: "2026-06-18T15:00:00.000Z", decisionAt: "2026-06-18T15:00:00.000Z", nextReviewAt: "2027-06-18T15:00:00.000Z",
    checks: checks("Verified"), secureDeliveryApproved: true, masterAccessApproved: true, stemAccessApproved: true, preApprovedTerms: true,
    questionnaire: baseQuestionnaire, projects: [{ id: "project-ob-1", name: "Northstar Fall Campaign", productionCompany: "Northstar Pictures", client: "Aster Automotive", role: "Senior Music Supervisor", type: "Advertising campaign", year: "2026", url: "https://northstar.example/work", responsibility: "Music selection and licensing", notes: "Global campaign" }],
    references: [{ id: "ref-ob-1", name: "Maya Hart", company: "Northstar Pictures", jobTitle: "Executive Producer", email: "maya@northstarpictures.com", relationship: "Colleague", permission: true, status: "Verified" }],
    documents: [{ id: "doc-ob-1", name: "northstar-employment-letter.pdf", size: "1.2 MB", type: "application/pdf", category: "Employment verification", uploadedAt: "2026-06-10T10:10:00.000Z", uploadedBy: "Olivia Bennett", status: "Accepted" }],
    internalNotes: [{ id: "note-ob-1", author: "Preston Repenning", timestamp: "2026-06-18T14:50:00.000Z", type: "Decision", visibility: "Internal Only", content: "Established buyer relationship and verified company role." }],
    buyerVisibleMessages: [{ id: "msg-ob-1", title: "Verification approved", body: "VIP Sync Access and approved secure delivery are active.", createdAt: "2026-06-18T15:00:00.000Z" }],
    riskFactors: [], positiveSignals: ["Verified corporate domain", "Established company", "Known industry role", "Previous licensing activity"], restrictions: [], informationRequests: [], checklist: Object.fromEntries(["Identity reviewed", "Company reviewed", "Professional role reviewed", "Intended use reviewed", "Credits reviewed", "References reviewed", "Documents reviewed", "Risk assessment complete", "Requested tier appropriate", "Secure-delivery eligibility reviewed", "Master access eligibility reviewed", "Stem access eligibility reviewed", "Pre-approved terms reviewed", "Final decision ready"].map((item) => [item, true])),
    activity: [activity("act-ob-1", "Preston Repenning", "Buyer approved", "Approved", "VIP Sync Access approved with secure master and stem delivery.", "2026-06-18T15:00:00.000Z")],
    decision: { recommendation: "VIP Sync Access", approvedTier: "VIP Sync Access", approver: "Preston Repenning", buyerMessage: "Your VIP Sync Access has been approved.", internalRationale: "All professional checks completed.", approvalReference: "BM-APP-2026-0007" },
  },
  {
    id: "verification-ethan", reference: "BM-BV-2026-0018", userId: "user-ethan", organizationId: "org-brightframe",
    buyerName: "Ethan Cole", email: "ethan@brightframeagency.com", company: "BrightFrame Agency", jobTitle: "Creative Producer",
    requestedAccessTier: "Professional Buyer", currentAccessTier: "Discovery Access", status: "Under Review", riskLevel: "Medium", progressStep: 10,
    submittedAt: "2026-07-13T11:00:00.000Z", assignedReviewerId: "reviewer-maya", reviewStartedAt: "2026-07-14T09:30:00.000Z", reviewedAt: null, decisionAt: null, nextReviewAt: null,
    checks: { ...checks("Pending"), emailDomain: "Verified", intendedUsage: "Verified", documents: "Partially Verified" }, secureDeliveryApproved: false, masterAccessApproved: false, stemAccessApproved: false, preApprovedTerms: false,
    questionnaire: { ...baseQuestionnaire, professional: { ...baseQuestionnaire.professional, legalName: "Ethan Cole", preferredName: "Ethan", role: "Creative Producer" }, company: { ...baseQuestionnaire.company, legalName: "BrightFrame Agency", website: "https://brightframeagency.com", emailDomain: "brightframeagency.com", type: "Creative agency" } },
    projects: [{ id: "project-ec-1", name: "BrightFrame Brand Reel", productionCompany: "BrightFrame Agency", client: "Confidential brand", role: "Creative Producer", type: "Branded content", year: "2026", url: "https://brightframeagency.com/work", responsibility: "Creative and music brief", notes: "Pending public credit" }], references: [],
    documents: [{ id: "doc-ec-1", name: "brightframe-business-card.png", size: "640 KB", type: "image/png", category: "Business card", uploadedAt: "2026-07-13T11:20:00.000Z", uploadedBy: "Ethan Cole", status: "Pending Review" }],
    internalNotes: [{ id: "note-ec-1", author: "Maya Thompson", timestamp: "2026-07-14T09:35:00.000Z", type: "Review", visibility: "Internal Only", content: "Company and current producer role require confirmation." }], buyerVisibleMessages: [], riskFactors: ["Company details pending", "No verified reference"], positiveSignals: ["Verified corporate domain"], restrictions: [], informationRequests: [], checklist: {},
    activity: [activity("act-ec-1", "Maya Thompson", "Review started", "Under Review", "Professional and company review started.", "2026-07-14T09:30:00.000Z")], decision: null,
  },
  {
    id: "verification-sofia", reference: "BM-BV-2026-0019", userId: "user-sofia", organizationId: "org-lighthouse",
    buyerName: "Sofia Martinez", email: "sofia@lighthousecreative.co", company: "Lighthouse Creative", jobTitle: "Freelance Music Supervisor",
    requestedAccessTier: "Professional Buyer", currentAccessTier: "Discovery Access", status: "Additional Information Required", riskLevel: "Medium", progressStep: 10,
    submittedAt: "2026-07-12T13:00:00.000Z", assignedReviewerId: "reviewer-maya", reviewStartedAt: "2026-07-13T10:00:00.000Z",
    checks: { ...checks("Under Review"), emailDomain: "Verified", credits: "Additional Information Required", references: "Additional Information Required" }, secureDeliveryApproved: false, masterAccessApproved: false, stemAccessApproved: false, preApprovedTerms: false,
    questionnaire: { ...baseQuestionnaire, professional: { ...baseQuestionnaire.professional, legalName: "Sofia Martinez", role: "Music Supervisor" }, company: { ...baseQuestionnaire.company, legalName: "Lighthouse Creative", type: "Independent professional" } }, projects: [], references: [], documents: [], internalNotes: [{ id: "note-sm-1", author: "Maya Thompson", timestamp: "2026-07-15T09:00:00.000Z", type: "Information request", visibility: "Internal Only", content: "Need one current production credit and a client reference." }], buyerVisibleMessages: [{ id: "msg-sm-1", title: "Additional information required", body: "Please provide a recent production credit, a client or agency reference, and clarification of intended territories.", createdAt: "2026-07-15T09:00:00.000Z" }], riskFactors: ["Freelance role requires credit verification"], positiveSignals: ["Verified professional domain"], restrictions: [],
    informationRequests: [{ id: "info-sm-1", title: "Professional evidence required", fields: ["Recent production credit", "Client or agency reference", "Intended territories"], documents: ["Production credit evidence"], buyerExplanation: "Please provide the listed items so we can complete professional verification.", internalNotes: "Validate active professional work.", dueDate: "2026-07-29", priority: "High", reviewer: "Maya Thompson", sentAt: "2026-07-15T09:00:00.000Z", status: "Open" }], checklist: {}, activity: [activity("act-sm-1", "Maya Thompson", "Information requested", "Additional Information Required", "Requested current professional evidence.", "2026-07-15T09:00:00.000Z")], decision: null,
  },
  {
    id: "verification-daniel", reference: "BM-BV-2026-0015", userId: "user-daniel", organizationId: "org-independent", buyerName: "Daniel Brooks", email: "daniel@independentmail.com", company: "Self-employed", jobTitle: "Content Creator", requestedAccessTier: "VIP Sync Access", currentAccessTier: "Discovery Access", status: "Rejected", riskLevel: "High", progressStep: 10, submittedAt: "2026-06-20T12:00:00.000Z", assignedReviewerId: "user-preston", decisionAt: "2026-07-01T16:00:00.000Z", reapplicationAllowedAt: "2026-10-01T00:00:00.000Z", checks: { ...checks("Failed"), emailDomain: "Partially Verified", identity: "Verified" }, secureDeliveryApproved: false, masterAccessApproved: false, stemAccessApproved: false, preApprovedTerms: false, questionnaire: baseQuestionnaire, projects: [], references: [], documents: [], internalNotes: [{ id: "note-db-1", author: "Preston Repenning", timestamp: "2026-07-01T15:50:00.000Z", type: "Decision", visibility: "Internal Only", content: "Company could not be verified. Insufficient commercial usage history. VIP request unsupported by evidence." }], buyerVisibleMessages: [{ id: "msg-db-1", title: "Verification decision", body: "We could not verify the professional licensing requirements associated with this application.", createdAt: "2026-07-01T16:00:00.000Z" }], riskFactors: ["Public email domain", "No professional credits", "VIP request without evidence"], positiveSignals: [], restrictions: ["Discovery access only"], informationRequests: [], checklist: {}, activity: [activity("act-db-1", "Preston Repenning", "Buyer rejected", "Rejected", "Professional access was not approved.", "2026-07-01T16:00:00.000Z")], decision: { recommendation: "Reject", approvedTier: "Discovery Access", approver: "Preston Repenning", buyerMessage: "We could not verify the professional licensing requirements associated with this application.", internalRationale: "Submitted evidence did not support professional or VIP eligibility." },
  },
  {
    id: "verification-rachel", reference: "BM-BV-2025-0098", userId: "user-rachel", organizationId: "org-orbit", buyerName: "Rachel Kim", email: "rachel@orbittrailers.com", company: "Orbit Trailers", jobTitle: "Music Coordinator", requestedAccessTier: "Professional Buyer", currentAccessTier: "Discovery Access", previousAccessTier: "Professional Buyer", status: "Suspended", riskLevel: "Medium", progressStep: 10, submittedAt: "2025-05-18T11:00:00.000Z", assignedReviewerId: "reviewer-amelia", decisionAt: "2026-07-10T12:00:00.000Z", checks: { ...checks("Expired"), identity: "Verified", credits: "Verified" }, secureDeliveryApproved: false, masterAccessApproved: false, stemAccessApproved: false, preApprovedTerms: false, questionnaire: baseQuestionnaire, projects: [], references: [], documents: [], internalNotes: [{ id: "note-rk-1", author: "Amelia Grant", timestamp: "2026-07-10T11:45:00.000Z", type: "Suspension", visibility: "Internal Only", content: "Company domain changed and previous work email is inactive." }], buyerVisibleMessages: [{ id: "msg-rk-1", title: "Reverification required", body: "Your professional access is temporarily restricted while we verify updated company information.", createdAt: "2026-07-10T12:00:00.000Z" }], riskFactors: ["Company domain changed", "Previous work email inactive"], positiveSignals: ["Previously approved buyer"], restrictions: ["Secure delivery disabled", "Discovery access only"], informationRequests: [{ id: "info-rk-1", title: "Updated company information", fields: ["Current work email", "Updated company details"], documents: ["Employment verification"], buyerExplanation: "Submit updated company information to restore professional access.", internalNotes: "Confirm current employer and domain.", dueDate: "2026-08-01", priority: "High", reviewer: "Amelia Grant", sentAt: "2026-07-10T12:00:00.000Z", status: "Open" }], checklist: {}, activity: [activity("act-rk-1", "Amelia Grant", "Buyer suspended", "Suspended", "Professional access suspended pending reverification.", "2026-07-10T12:00:00.000Z")], decision: { recommendation: "Require Reverification", approvedTier: "Discovery Access", approver: "Preston Repenning", buyerMessage: "Updated company information is required to restore access.", internalRationale: "Corporate identity details expired." },
  },
];

export const DEFAULT_VERIFICATION_STATE = { version: 1, applications: DEFAULT_VERIFICATIONS, lastReference: 19 };

