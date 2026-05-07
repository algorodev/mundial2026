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
  };
}
