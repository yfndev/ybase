import type { convexTest } from "convex-test";

export const modules = import.meta.glob("./**/*.ts");

export async function setupTestData(test: ReturnType<typeof convexTest>) {
  // convex insert returns the id of the inserted document
  return await test.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      email: "test@test.com",
      role: "admin",
    });

    const organizationId = await ctx.db.insert("organizations", {
      name: "Test Organization",
      domain: "test.com",
      createdBy: userId,
    });

    await ctx.db.patch(userId, { organizationId });

    await ctx.db.insert("projects", {
      name: "Rücklagen",
      organizationId,
      isArchived: false,
      createdBy: userId,
    });

    const projectId = await ctx.db.insert("projects", {
      name: "Test Project",
      organizationId,
      isArchived: false,
      createdBy: userId,
    });

    const categoryId = await ctx.db.insert("categories", {
      name: "Test Category",
      taxsphere: "non-profit",
      approved: true,
    });

    const donorId = await ctx.db.insert("donors", {
      name: "Test Donor",
      type: "donation",
      allowedTaxSpheres: ["non-profit"],
      organizationId,
      createdBy: userId,
    });

    const teamId = await ctx.db.insert("teams", {
      name: "Test Team",
      organizationId,
      memberIds: [userId],
      projectIds: [projectId],
      createdBy: userId,
    });

    const reimbursementId = await ctx.db.insert("reimbursements", {
      organizationId,
      projectId,
      amount: 100,
      type: "expense",
      status: "pending",
      iban: "DE12340000000000000000",
      bic: "BIC",
      accountHolder: "Test",
      createdBy: userId,
    });

    const travelReimbursementId = await ctx.db.insert("reimbursements", {
      organizationId,
      projectId,
      amount: 200,
      type: "travel",
      status: "pending",
      iban: "DE12340000000000000000",
      bic: "BIC",
      accountHolder: "Test",
      createdBy: userId,
    });

    await ctx.db.insert("travelDetails", {
      reimbursementId: travelReimbursementId,
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      destination: "Berlin",
      purpose: "Conference",
      isInternational: false,
    });

    return {
      organizationId,
      userId,
      projectId,
      categoryId,
      donorId,
      teamId,
      reimbursementId,
      travelReimbursementId,
    };
  });
}
