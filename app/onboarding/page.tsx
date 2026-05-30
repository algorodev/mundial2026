import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Si ya tiene nombre, no necesita onboarding
  if (session.name) {
    redirect("/groups");
  }

  const { next } = await props.searchParams;
  const dest = next && next.startsWith("/") ? next : "/groups";

  return <OnboardingClient next={dest} />;
}
