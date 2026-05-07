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
  const { h, maxW } = SIZE[size];
  return (
    <Image
      src={`/tournaments/${slug}.png`}
      alt={name}
      // width/height nominales para que Next sepa el aspect; el render real lo
      // controla style: alto fijo, ancho automático.
      width={200}
      height={200}
      style={{ height: `${h}px`, width: "auto", maxWidth: `${maxW}px` }}
      className={`object-contain ${className}`}
      unoptimized
    />
  );
}
