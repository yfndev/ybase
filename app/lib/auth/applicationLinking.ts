import { normalizeYfnEmail } from "../applications/yfnEmail";
import { applications, jobPostings, users } from "../db/collections";
import type { Application, User } from "../db/types";
import { addLog } from "../server/logs";
import { createApplicationHistoryEntry } from "../server/applications/history";

async function recordLinkError(
  applicationIds: string[],
  message: string,
): Promise<void> {
  await (
    await applications()
  ).updateMany(
    { _id: { $in: applicationIds } },
    { $set: { onboardingLinkError: message, updatedAt: Date.now() } },
  );
}

export async function linkAcceptedApplication(user: User): Promise<User> {
  if (!user.email || !user.organizationId || user.applicationId) return user;

  const email = normalizeYfnEmail(user.email);
  const matches = await (
    await applications()
  )
    .find({
      organizationId: user.organizationId,
      status: "accepted",
      yfnEmailNormalized: email,
    })
    .limit(2)
    .toArray();
  if (matches.length === 0) return user;
  if (matches.length > 1) {
    await recordLinkError(
      matches.map(({ _id }) => _id),
      "Mehrere angenommene Bewerbungen verwenden diese YFN-E-Mail.",
    );
    return user;
  }

  const application = matches[0];
  const error = await validateLink(user, application, email);
  if (error) {
    await recordLinkError([application._id], error);
    return user;
  }

  const posting = await (
    await jobPostings()
  ).findOne({
    _id: application.jobPostingId,
    organizationId: user.organizationId,
  });
  if (!posting) {
    await recordLinkError(
      [application._id],
      "Die zugehörige Ausschreibung wurde nicht gefunden.",
    );
    return user;
  }

  const timestamp = Date.now();
  const claim = await (
    await applications()
  ).updateOne(
    {
      _id: application._id,
      status: "accepted",
      yfnEmailNormalized: email,
      $or: [
        { onboardingUserId: { $exists: false } },
        { onboardingUserId: user._id },
      ],
    },
    {
      $set: {
        onboardingUserId: user._id,
        onboardingLinkedAt: timestamp,
        cleanupEligibleAt: timestamp,
        updatedAt: timestamp,
      },
      $unset: { onboardingLinkError: "" },
    },
  );
  if (claim.matchedCount !== 1) return user;

  const linked = await (
    await users()
  ).updateOne(
    {
      _id: user._id,
      $or: [
        { applicationId: { $exists: false } },
        { applicationId: application._id },
      ],
    },
    {
      $set: {
        applicationId: application._id,
        teamId: posting.teamId,
        positionTitle: posting.title,
        memberStatus: "onboarding",
        teamOnboardingStatus: "not_started",
      },
    },
  );
  if (linked.matchedCount !== 1) {
    if (!application.onboardingUserId) {
      await (
        await applications()
      ).updateOne(
        { _id: application._id, onboardingUserId: user._id },
        {
          $unset: {
            onboardingUserId: "",
            onboardingLinkedAt: "",
            cleanupEligibleAt: "",
          },
        },
      );
    }
    return user;
  }

  const entry = createApplicationHistoryEntry(
    user._id,
    "management_updated",
    "Mit internem Onboarding-Profil verknüpft",
  );
  await (
    await applications()
  ).updateOne({ _id: application._id }, { $push: { history: entry } });
  try {
    await addLog(
      user.organizationId,
      user._id,
      "application.onboarding_linked",
      application._id,
    );
  } catch (logError) {
    console.error("application onboarding audit log failed", logError);
  }

  return {
    ...user,
    applicationId: application._id,
    teamId: posting.teamId,
    positionTitle: posting.title,
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
  };
}

async function validateLink(
  user: User,
  application: Application,
  email: string,
): Promise<string | undefined> {
  if (
    application.onboardingUserId &&
    application.onboardingUserId !== user._id
  ) {
    return "Diese Bewerbung ist bereits mit einem anderen Profil verknüpft.";
  }
  if (user.memberStatus !== "onboarding") {
    return "Die YFN-E-Mail gehört bereits zu einem aktiven oder offboardeten Mitglied.";
  }

  const conflicts = await (
    await users()
  )
    .find({
      _id: { $ne: user._id },
      $or: [{ email }, { applicationId: application._id }],
    })
    .limit(1)
    .toArray();
  return conflicts.length > 0
    ? "Die YFN-E-Mail oder Bewerbung ist bereits einem anderen Profil zugeordnet."
    : undefined;
}
