import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { atelierByCode } from "@/config/ateliers";
import { grilleEvaluationCsv } from "@/config/ateliers/formulaires";

/**
 * La grille de correction de l'enseignant, en tableur.
 *
 * Les critères en lignes, les équipes en colonnes : on corrige une séance pour
 * toute la classe d'un coup, et comparer est la moitié du travail.
 *
 * Derrière la session, non pour ce qu'elle dit mais pour ce qu'elle recevra :
 * les critères sont publics, et le dossier de l'élève les lui donne en toutes
 * lettres, mais ce fichier se remplit ensuite des appréciations nominatives
 * d'une classe. Il n'a rien à faire sur une adresse ouverte.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { code } = await params;
  const atelier = atelierByCode.get(code);
  if (!atelier) return new Response("Atelier introuvable.", { status: 404 });

  return new Response(grilleEvaluationCsv(atelier), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="grille-correction-${atelier.code}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
