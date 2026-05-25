import Link from "next/link";

type Tab = "predictions" | "leaderboard" | "standings" | "manage";

const labels: Record<Tab, string> = {
  predictions: "Pronósticos",
  leaderboard: "Clasificación",
  standings: "Tabla",
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
    { key: "standings", href: `/g/${slug}/standings` },
  ];
  if (isOwner) {
    tabs.push({ key: "manage", href: `/g/${slug}/manage` });
  }

  return (
    // En mobile: scroll horizontal (los 4 chips no caben en 1 línea
    // y wrap a 2 líneas se ve apretado). En sm+ flex normal con wrap
    // por si añadimos más tabs en el futuro.
    // -mx para que el área scrollable llegue al borde del contenido sin
    // dejar margen, y px-4 para que la primera tab no quede pegada al borde.
    <div className="-mx-4 sm:mx-0 mb-8 overflow-x-auto sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-2 px-4 sm:px-0 sm:flex-wrap w-max sm:w-auto">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`shrink-0 px-4 py-2 font-display text-xs sm:text-sm uppercase tracking-widest border-2 border-pitch-950 rounded transition-all ${
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
    </div>
  );
}
