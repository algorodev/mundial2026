import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Accede a PorraBros con tu email y contraseña.",
  alternates: { canonical: "/login" },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
