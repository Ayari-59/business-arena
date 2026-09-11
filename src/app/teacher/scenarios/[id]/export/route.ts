import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getScenarioById } from "@/services/scenario-editor.service";

export const dynamic = "force-dynamic";

/**
 * Export d'un scénario enseignant en JSON (sa `StoredScenarioDefinition`), pour
 * sauvegarde ou partage par fichier. Réservé à l'auteur du scénario.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const session = await getSession();
  if (!session) return new NextResponse("Non authentifié", { status: 401 });
  const loaded = await getScenarioById(id, session.userId);
  if (!loaded) return new NextResponse("Scénario introuvable", { status: 404 });

  return new NextResponse(JSON.stringify(loaded.definition, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${loaded.summary.code}.json"`,
    },
  });
}
