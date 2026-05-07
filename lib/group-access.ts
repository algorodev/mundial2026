import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { groupMembers, groups } from "./db/schema";

export type GroupContext = {
  groupId: number;
  slug: string;
  name: string;
  tournamentId: number;
  ownerId: number;
  myRole: "owner" | "member";
  // Settings configurables (defaults aplicados a nivel DB)
  predictionLockMode: string;
  lockMinutesBefore: number;
  joinPolicy: string;
  joinDeadline: Date | null;
  allowLateJoin: boolean;
  predictionsVisibility: string;
};

/**
 * Devuelve info del grupo si el user es miembro, o null en caso contrario.
 */
export async function getGroupForMember(
  slug: string,
  userId: number
): Promise<GroupContext | null> {
  const [row] = await db
    .select({
      groupId: groups.id,
      slug: groups.slug,
      name: groups.name,
      tournamentId: groups.tournamentId,
      ownerId: groups.ownerId,
      role: groupMembers.role,
      predictionLockMode: groups.predictionLockMode,
      lockMinutesBefore: groups.lockMinutesBefore,
      joinPolicy: groups.joinPolicy,
      joinDeadline: groups.joinDeadline,
      allowLateJoin: groups.allowLateJoin,
      predictionsVisibility: groups.predictionsVisibility,
    })
    .from(groups)
    .innerJoin(
      groupMembers,
      and(
        eq(groupMembers.groupId, groups.id),
        eq(groupMembers.userId, userId)
      )
    )
    .where(eq(groups.slug, slug))
    .limit(1);

  if (!row) return null;

  return {
    groupId: row.groupId,
    slug: row.slug,
    name: row.name,
    tournamentId: row.tournamentId,
    ownerId: row.ownerId,
    myRole: row.role === "owner" ? "owner" : "member",
    predictionLockMode: row.predictionLockMode,
    lockMinutesBefore: row.lockMinutesBefore,
    joinPolicy: row.joinPolicy,
    joinDeadline: row.joinDeadline,
    allowLateJoin: row.allowLateJoin === 1,
    predictionsVisibility: row.predictionsVisibility,
  };
}
