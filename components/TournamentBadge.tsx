import Image from "next/image";

type Size = "sm" | "md" | "lg" | "xl";

// Altura fija por tamaño. El ancho se ajusta según el aspect ratio del logo,
// así Mundial (ancho), Champions (cuadrado) y LaLiga (vertical) acaban con el
// mismo alto visual aunque sus proporciones difieran. maxWidth evita que un
// logo extremadamente apaisado rompa el layout.
const SIZE: Record<Size, { h: number; maxW: number }> = {
  sm: { h: 24, maxW: 64 },
  md: { h: 36, maxW: 96 },
  lg: { h: 52, maxW: 128 },
  xl: { h: 88, maxW: 200 },
};

/**
 * Logo oficial del torneo desde /public/tournaments/{slug}.png.
 *
 * `onDark` envuelve el logo en una caja blanca con borde para que se siga
 * viendo cuando el padre tiene fondo oscuro (e.g. algunos logos como el de
 * la Champions son azul marino y se pierden contra bg-pitch-950).
 */
export default function TournamentBadge({
  slug,
  name,
  size = "md",
  onDark = false,
  className = "",
}: {
  slug: string;
  name: string;
  size?: Size;
  onDark?: boolean;
  className?: string;
}) {
  const { h, maxW } = SIZE[size];
  const wrapperClass = onDark
    ? "bg-paper-50 border-2 border-pitch-950 rounded shadow-brutal-sm p-2"
    : "";
  return (
    <span
      className={`inline-flex items-center justify-center ${wrapperClass} ${className}`}
    >
      <Image
        src={`/tournaments/${slug}.png`}
        alt={name}
        width={200}
        height={200}
        style={{ height: `${h}px`, width: "auto", maxWidth: `${maxW}px` }}
        className="object-contain"
        unoptimized
      />
    </span>
  );
}
