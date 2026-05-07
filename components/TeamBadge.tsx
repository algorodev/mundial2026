import Image from "next/image";

type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = { sm: 32, md: 48, lg: 64 };

/**
 * Logo del equipo si tenemos uno en /public/teams/{code}.png; si no, cae al
 * emoji de bandera. Diseñado para mantener el layout cuando un torneo no tiene
 * logos asociados.
 */
export default function TeamBadge({
  code,
  flag,
  alt,
  size = "md",
}: {
  code: string | null | undefined;
  flag: string | null | undefined;
  alt: string;
  size?: Size;
}) {
  if (code) {
    const px = SIZE_PX[size];
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
