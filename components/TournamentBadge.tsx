import Image from "next/image";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 96,
};

/**
 * Logo oficial del torneo desde /public/tournaments/{slug}.png. Si no
 * encontramos el archivo, Next devuelve un 404 y la imagen no se pinta;
 * en ese caso el padre puede mostrar un fallback (un emoji 🏆 al lado).
 */
export default function TournamentBadge({
  slug,
  name,
  size = "md",
  className = "",
}: {
  slug: string;
  name: string;
  size?: Size;
  className?: string;
}) {
  const px = SIZE_PX[size];
  return (
    <Image
      src={`/tournaments/${slug}.png`}
      alt={name}
      width={px}
      height={px}
      className={`inline-block object-contain ${className}`}
      unoptimized
    />
  );
}
