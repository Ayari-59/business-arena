import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { ManuelImprimable } from "@/components/manuel-imprimable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manuel de l'enseignant",
  // La version publique est à /manuel : c'est elle que les moteurs indexent,
  // pour ne pas présenter deux fois le même texte.
  robots: { index: false, follow: false },
};

/** Le manuel pour l'enseignant connecté, qui y arrive par sa navigation. */
export default async function ManuelPage() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  return <ManuelImprimable retour={{ href: "/teacher", label: "Espace enseignant" }} />;
}
