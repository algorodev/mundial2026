import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groups,
  groupMembers,
  groupJoinRequests,
  tournaments,
  users,
} from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getGroupForMember } from "@/lib/group-access";
import GroupTabs from "@/components/GroupTabs";
import ManageGroupClient from "@/components/ManageGroupClient";
import TournamentBadge from "@/components/TournamentBadge";

export default async function ManageGroupPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const session = await getSession();
  if (!session)
    redirect(`/login?next=${encodeURIComponent(`/g/${params.slug}/manage`)}`);

  const ctx = await getGroupForMember(params.slug, session.userId);
  if (!ctx) notFound();
  if (ctx.myRole !== "owner") {
    redirect(`/g/${params.slug}`);
  }

  const [details, memberRows, requestRows] = await Promise.all([
    db
      .select({
        inviteCode: groups.inviteCode,
        tournamentName: tournaments.name,
        tournamentSlug: tournaments.slug,
        description: groups.description,
        predictionLockMode: groups.predictionLockMode,
        lockMinutesBefore: groups.lockMinutesBefore,
        joinPolicy: groups.joinPolicy,
        joinDeadline: groups.joinDeadline,
        allowLateJoin: groups.allowLateJoin,
        predictionsVisibility: groups.predictionsVisibility,
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
    db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        requestedAt: groupJoinRequests.requestedAt,
      })
      .from(groupJoinRequests)
      .innerJoin(users, eq(groupJoinRequests.userId, users.id))
      .where(eq(groupJoinRequests.groupId, ctx.groupId))
      .orderBy(asc(groupJoinRequests.requestedAt)),
  ]);

  return (
    <div className="pt-8">
      <Link
        href="/groups"
        className="inline-block font-mono text-xs text-chalk-300 hover:text-flame-400 uppercase tracking-widest mb-3"
      >
        ← Mis porras
      </Link>
      <div className="mb-6 flex items-start gap-4">
        <TournamentBadge
          slug={details.tournamentSlug}
          name={details.tournamentName}
          size="xl"
          onDark
          className="shrink-0 mt-1"
        />
        <div className="min-w-0">
          <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
            {ctx.name}
          </h1>
          <p className="mt-3 inline-block bg-paper-50 text-pitch-950 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
            {details.tournamentName}
          </p>
        </div>
      </div>
      <GroupTabs slug={ctx.slug} active="manage" isOwner />
      <ManageGroupClient
        slug={ctx.slug}
        ownerId={ctx.ownerId}
        myUserId={session.userId}
        inviteCode={details.inviteCode}
        groupName={ctx.name}
        initialSettings={{
          description: details.description ?? "",
          predictionLockMode:
            details.predictionLockMode === "tournament-start"
              ? "tournament-start"
              : "per-match",
          lockMinutesBefore: details.lockMinutesBefore,
          joinPolicy:
            details.joinPolicy === "approval"
              ? "approval"
              : details.joinPolicy === "closed"
                ? "closed"
                : "open",
          joinDeadlineIso: details.joinDeadline?.toISOString() ?? null,
          allowLateJoin: details.allowLateJoin === 1,
          predictionsVisibility:
            details.predictionsVisibility === "open"
              ? "open"
              : "hidden-until-lock",
        }}
        members={memberRows.map((m) => ({
          ...m,
          joinedAt: m.joinedAt.toISOString(),
        }))}
        initialRequests={requestRows.map((r) => ({
          ...r,
          requestedAt: r.requestedAt.toISOString(),
        }))}
      />
    </div>
  );
}
