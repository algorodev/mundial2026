import Image from "next/image";

type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = { sm: 32, md: 48, lg: 64 };

/**
 * Escudo del equipo. Prioridad de fuentes:
 *   1. logoUrl       → URL oficial de API-Football (teams.logoUrl)
 *   2. /teams/{code} → asset local en public/teams/{code}.png
 *   3. flag          → emoji bandera (legacy / fallback)
 *
 * Diseñado para mantener el layout aunque alguna fuente falte.
 */
export default function TeamBadge({
  code,
  flag,
  logoUrl,
  alt,
  size = "md",
}: {
  code: string | null | undefined;
  flag: string | null | undefined;
  logoUrl?: string | null;
  alt: string;
  size?: Size;
}) {
  const px = SIZE_PX[size];

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={alt}
        width={px}
        height={px}
        className="inline-block object-contain"
        unoptimized
      />
    );
  }
  if (code) {
    return (
      <Image
        src={`/teams/${code}.png`}
        alt={alt}
        width={px}
        height={px}
        className="inline-block object-contain"
        unoptimized
      />
    );
  }
  if (flag) {
    const cls =
      size === "lg"
        ? "text-4xl sm:text-5xl"
        : size === "sm"
          ? "text-xl sm:text-2xl"
          : "text-3xl sm:text-4xl";
    return <span className={cls}>{flag}</span>;
  }
  return null;
}
