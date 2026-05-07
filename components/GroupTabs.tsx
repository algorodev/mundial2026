import Link from "next/link";

type Tab = "predictions" | "leaderboard" | "manage";

const labels: Record<Tab, string> = {
  predictions: "Pronósticos",
  leaderboard: "Clasificación",
  manage: "Gestionar",
};

export default function GroupTabs({
  slug,
  active,
  isOwner,
}: {
  slug: string;
  active: Tab;
  isOwner: boolean;
}) {
  const tabs: { key: Tab; href: string }[] = [
    { key: "predictions", href: `/g/${slug}` },
    { key: "leaderboard", href: `/g/${slug}/leaderboard` },
  ];
  if (isOwner) {
    tabs.push({ key: "manage", href: `/g/${slug}/manage` });
  }

  return (
    <div className="flex gap-2 mb-8 flex-wrap">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`px-4 py-2 font-display text-xs sm:text-sm uppercase tracking-widest border-2 border-pitch-950 rounded transition-all ${
              isActive
                ? "bg-flame-500 text-pitch-950 shadow-brutal -translate-x-0.5 -translate-y-0.5"
                : "bg-paper-50 text-pitch-950 shadow-brutal-sm hover:-translate-y-0.5"
            }`}
          >
            {labels[t.key]}
          </Link>
        );
      })}
    </div>
  );
}
