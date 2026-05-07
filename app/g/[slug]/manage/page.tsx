import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groups,
  groupMembers,
  tournaments,
  users,
} from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getGroupForMember } from "@/lib/group-access";
import GroupTabs from "@/components/GroupTabs";
import ManageGroupClient from "@/components/ManageGroupClient";

export default async function ManageGroupPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSession();
  if (!session)
    redirect(`/login?next=${encodeURIComponent(`/g/${params.slug}/manage`)}`);

  const ctx = await getGroupForMember(params.slug, session.userId);
  if (!ctx) notFound();
  if (ctx.myRole !== "owner") {
    redirect(`/g/${params.slug}`);
  }

  const [details, memberRows] = await Promise.all([
    db
      .select({
        inviteCode: groups.inviteCode,
        tournamentName: tournaments.name,
      })
      .from(groups)
      .innerJoin(tournaments, eq(groups.tournamentId, tournaments.id))
      .where(eq(groups.id, ctx.groupId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, ctx.groupId))
      .orderBy(asc(groupMembers.joinedAt)),
  ]);

  return (
    <div className="pt-8">
      <Link
        href="/groups"
        className="inline-block font-mono text-xs text-chalk-300 hover:text-flame-400 uppercase tracking-widest mb-3"
      >
        ← Mis porras
      </Link>
      <div className="mb-6">
        <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
          {ctx.name}
        </h1>
        <p className="mt-3 inline-block bg-paper-50 text-pitch-950 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {details.tournamentName}
        </p>
      </div>
      <GroupTabs slug={ctx.slug} active="manage" isOwner />
      <ManageGroupClient
        slug={ctx.slug}
        ownerId={ctx.ownerId}
        myUserId={session.userId}
        inviteCode={details.inviteCode}
        members={memberRows.map((m) => ({
          ...m,
          joinedAt: m.joinedAt.toISOString(),
        }))}
      />
    </div>
  );
}
