import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta en PorraBros con email y contraseña.",
  alternates: { canonical: "/register" },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
