"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TeamBadge from "@/components/TeamBadge";

type Team = {
  code: string;
  name: string;
  flagEmoji: string | null;
  logoUrl: string | null;
};

export default function TeamCarousel({
  groupSlug,
  teams,
  labelPrev,
  labelNext,
}: {
  groupSlug: string;
  teams: Team[];
  labelPrev: string;
  labelNext: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByPage(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (teams.length === 0) return null;

  return (
    <div className="mb-8 flex items-center gap-1 sm:gap-2">
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        aria-label={labelPrev}
        className="hidden sm:flex shrink-0 p-2.5 border-2 border-pitch-950 bg-paper-50 text-pitch-950 shadow-brutal-sm hover:bg-paper-100 transition-all"
      >
        <ChevronLeft size={16} />
      </button>
      <div
        ref={scrollerRef}
        className="flex gap-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory px-1 py-1 no-scrollbar"
      >
        {teams.map((team) => (
          <Link
            key={team.code}
            href={`/g/${groupSlug}/team/${team.code}`}
            className="shrink-0 snap-start w-[76px] flex flex-col items-center gap-1.5 cromo-sm bg-paper-50 text-pitch-950 px-2 py-2.5 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all"
          >
            <TeamBadge
              code={team.code}
              flag={team.flagEmoji}
              logoUrl={team.logoUrl}
              alt={team.name}
              size="sm"
            />
            <span className="font-display uppercase text-[9px] leading-tight text-center truncate w-full">
              {team.name}
            </span>
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        aria-label={labelNext}
        className="hidden sm:flex shrink-0 p-2.5 border-2 border-pitch-950 bg-paper-50 text-pitch-950 shadow-brutal-sm hover:bg-paper-100 transition-all"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
