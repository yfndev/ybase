import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  organizations: defineTable({
    name: v.string(),
    domain: v.string(),
    createdBy: v.id("users"),
    street: v.optional(v.string()),
    plz: v.optional(v.string()),
    city: v.optional(v.string()),
    accountingEmail: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_domain", ["domain"]),
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),

    organizationId: v.optional(v.id("organizations")),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("lead"), v.literal("member")),
    ),
    iban: v.optional(v.string()),
    bic: v.optional(v.string()),
    accountHolder: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_organization", ["organizationId"]),

  projects: defineTable({
    name: v.string(),

    parentId: v.optional(v.id("projects")),
    organizationId: v.id("organizations"),
    isArchived: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_parentId", ["organizationId", "parentId"])
    .index("by_organization_archived", ["organizationId", "isArchived"]),

  transactions: defineTable({
    projectId: v.optional(v.id("projects")),
    organizationId: v.id("organizations"),
    date: v.number(),
    amount: v.number(),
    description: v.string(),
    counterparty: v.string(),
    categoryId: v.optional(v.id("categories")),
    donorId: v.optional(v.id("donors")),
    importedBy: v.id("users"),
    bankReferenceId: v.optional(v.string()),
    importedTransactionId: v.optional(v.string()),
    importSource: v.optional(
      v.union(
        v.literal("sparkasse"),
        v.literal("volksbank"),
        v.literal("moss"),
        v.literal("finom"),
      ),
    ),
    currency: v.optional(v.string()),
    status: v.union(v.literal("expected"), v.literal("processed")),
    matchedTransactionId: v.optional(v.id("transactions")),
    accountName: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
    splitFromTransactionId: v.optional(v.id("transactions")),
    transferId: v.optional(v.string()),
  })
    .index("by_organization_project", ["organizationId", "projectId"])
    .index("by_date", ["date"])
    .index("by_organization", ["organizationId"])
    .index("by_organization_donor", ["organizationId", "donorId"])
    .index("by_organization_project_donor", [
      "organizationId",
      "projectId",
      "donorId",
    ])
    .index("by_bankReferenceId", [
      "organizationId",
      "bankReferenceId",
    ])
    .index("by_splitFrom", ["splitFromTransactionId"])
    .index("by_archived", ["isArchived"])
    .index("by_transferId", ["transferId"])
    .index("by_organization_status", ["organizationId", "status"])
    .index("by_organization_date", ["organizationId", "date"]),

  categories: defineTable({
    name: v.string(),
    taxsphere: v.union(
      v.literal("non-profit"), // Ideeller Bereich
      v.literal("asset-management"), // Vermögensverwaltung
      v.literal("purpose-operations"), // Zweckbetrieb
      v.literal("commercial-operations"), // Wirtschaftlicher Geschäftsbetrieb
    ),
    approved: v.boolean(),
    createdBy: v.optional(v.id("users")),
    parentId: v.optional(v.id("categories")),
  })
    .index("by_parent", ["parentId"])
    .index("by_name", ["name"]),

  donors: defineTable({
    name: v.string(),
    type: v.union(v.literal("donation"), v.literal("sponsoring")),
    allowedTaxSpheres: v.array(
      v.union(
        v.literal("non-profit"),
        v.literal("asset-management"),
        v.literal("purpose-operations"),
        v.literal("commercial-operations"),
      ),
    ),
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
  }).index("by_organization", ["organizationId"]),

  teams: defineTable({
    name: v.string(),
    organizationId: v.id("organizations"),
    projectIds: v.array(v.id("projects")),
    memberIds: v.array(v.id("users")),
    createdBy: v.id("users"),
  }).index("by_organization", ["organizationId"]),

  reimbursements: defineTable({
    organizationId: v.id("organizations"),
    projectId: v.id("projects"),
    amount: v.number(),
    type: v.union(v.literal("expense"), v.literal("travel")),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("declined"))),
    isApproved: v.optional(v.boolean()),
    iban: v.string(),
    bic: v.optional(v.string()),
    accountHolder: v.string(),
    rejectionNote: v.optional(v.string()),
    createdBy: v.id("users"),
    reviewedBy: v.optional(v.id("users")),
    currency: v.optional(v.string()),
    // Sharing fields
    signatureStorageId: v.optional(v.id("_storage")),
    isSharedLink: v.optional(v.boolean()),
    submitterName: v.optional(v.string()),
    submitterEmail: v.optional(v.string()),
    description: v.optional(v.string()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_and_createdBy", ["organizationId", "createdBy"])
    .index("by_organization_project", ["organizationId", "projectId"]),

  travelDetails: defineTable({
    reimbursementId: v.id("reimbursements"),
    startDate: v.string(),
    endDate: v.string(),
    destination: v.string(),
    purpose: v.string(),
    isInternational: v.boolean(),
    mealAllowanceDays: v.optional(v.number()),
    mealAllowanceDailyBudget: v.optional(v.number()),
    allowFoodAllowance: v.optional(v.boolean()),
  }).index("by_reimbursement", ["reimbursementId"]),

  receipts: defineTable({
    reimbursementId: v.id("reimbursements"),
    receiptNumber: v.optional(v.string()),
    receiptDate: v.string(),
    companyName: v.string(),
    description: v.string(),
    netAmount: v.number(),
    taxRate: v.number(),
    grossAmount: v.number(),
    fileStorageId: v.id("_storage"),
    costType: v.optional(
      v.union(
        v.literal("car"),
        v.literal("train"),
        v.literal("flight"),
        v.literal("taxi"),
        v.literal("bus"),
        v.literal("accommodation"),
      ),
    ),
    kilometers: v.optional(v.number()),
  }).index("by_reimbursement", ["reimbursementId"]),

  logs: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    action: v.string(),
    entityId: v.string(),
    details: v.optional(v.string()),
  }).index("by_organization", ["organizationId"]),

  volunteerAllowance: defineTable({
    organizationId: v.id("organizations"),
    projectId: v.id("projects"),
    amount: v.number(),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("declined"))),
    isApproved: v.optional(v.boolean()),
    token: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    usedAt: v.optional(v.number()),
    iban: v.string(),
    bic: v.optional(v.string()),
    accountHolder: v.string(),
    rejectionNote: v.optional(v.string()),
    createdBy: v.id("users"),
    reviewedBy: v.optional(v.id("users")),
    activityDescription: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    taxYear: v.optional(v.string()),
    volunteerName: v.string(),
    volunteerStreet: v.string(),
    volunteerPlz: v.string(),
    volunteerCity: v.string(),
    signatureStorageId: v.optional(v.id("_storage")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_and_createdBy", ["organizationId", "createdBy"])
    .index("by_organization_project", ["organizationId", "projectId"]),

  signatureTokens: defineTable({
    token: v.string(),
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    expiresAt: v.number(),
    signatureStorageId: v.optional(v.id("_storage")),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_createdBy", ["createdBy"]),
});
