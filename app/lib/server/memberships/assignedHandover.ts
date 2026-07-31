"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import { memberships, users } from "../../db/collections";
import { appendMembershipEvent } from "./events";

export async function getOwnAssignedHandoverTasks() {
  const actor = await requireUser();
  const records = await (
    await memberships()
  )
    .find({
      organizationId: actor.organizationId,
      handoverTasks: { $elemMatch: { ownerUserId: actor._id } },
    })
    .toArray();
  const memberUsers = await (
    await users()
  )
    .find({
      _id: { $in: records.map(({ userId }) => userId) },
      organizationId: actor.organizationId,
    })
    .project({ name: 1, email: 1 })
    .toArray();
  const names = new Map(
    memberUsers.map((member) => [
      member._id,
      member.name ?? member.email ?? "Mitglied",
    ]),
  );
  return records.flatMap((membership) =>
    membership.handoverTasks
      .filter(({ ownerUserId }) => ownerUserId === actor._id)
      .map((task) => ({
        membershipId: membership._id,
        taskId: task._id,
        memberName: names.get(membership.userId) ?? "Mitglied",
        title: task.title,
        scheduledEndAt: membership.scheduledEndAt,
        completedAt: task.completedAt,
      })),
  );
}

export async function setAssignedHandoverTaskCompleted(input: {
  membershipId: string;
  taskId: string;
  isCompleted: boolean;
}): Promise<void> {
  const parsed = z
    .object({
      membershipId: z.string().min(1),
      taskId: z.string().min(1),
      isCompleted: z.boolean(),
    })
    .parse(input);
  const actor = await requireUser();
  const now = Date.now();
  const collection = await memberships();
  const membership = await collection.findOne({
    _id: parsed.membershipId,
    organizationId: actor.organizationId,
    handoverTasks: {
      $elemMatch: { _id: parsed.taskId, ownerUserId: actor._id },
    },
  });
  if (!membership) throw new Error("Aufgabe nicht gefunden.");
  const task = membership.handoverTasks.find(
    ({ _id }) => _id === parsed.taskId,
  );
  if (Boolean(task?.completedAt) === parsed.isCompleted) return;
  const result = await collection.updateOne(
    {
      _id: parsed.membershipId,
      organizationId: actor.organizationId,
      handoverTasks: {
        $elemMatch: { _id: parsed.taskId, ownerUserId: actor._id },
      },
    },
    parsed.isCompleted
      ? {
          $set: {
            "handoverTasks.$[task].completedAt": now,
            "handoverTasks.$[task].completedBy": actor._id,
            updatedAt: now,
          },
        }
      : {
          $unset: {
            "handoverTasks.$[task].completedAt": "",
            "handoverTasks.$[task].completedBy": "",
          },
          $set: { updatedAt: now },
        },
    {
      arrayFilters: [
        { "task._id": parsed.taskId, "task.ownerUserId": actor._id },
      ],
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Die Aufgabe wurde zwischenzeitlich geändert.");
  }
  await appendMembershipEvent({
    organizationId: actor.organizationId,
    membershipId: membership._id,
    userId: membership.userId,
    actorUserId: actor._id,
    actorType: "user",
    type: "handover.task_updated",
    details: { taskId: parsed.taskId, isCompleted: parsed.isCompleted },
  });
}

export type AssignedHandoverTask = Awaited<
  ReturnType<typeof getOwnAssignedHandoverTasks>
>[number];
