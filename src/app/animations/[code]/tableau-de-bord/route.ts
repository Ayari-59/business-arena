import { atelierByCode } from "@/config/ateliers";
import { tableauDeBordCsv } from "@/config/ateliers/dossiers";

/**
 * Le tableau de bord de l'équipe, servi en tableur.
 *
 * Le fichier lui même se construit dans le registre, où un test peut le relire
 * ligne par ligne : ses formules renvoient à des numéros de ligne, et une
 * référence décalée d'un rang donnerait un tableau qui s'ouvre, qui calcule, et
 * qui ment.
 */
export async function generateStaticParams() {
  const { ATELIERS } = await import("@/config/ateliers");
  return ATELIERS.map((a) => ({ code: a.code }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const atelier = atelierByCode.get(code);
  if (!atelier) return new Response("Atelier introuvable.", { status: 404 });

  return new Response(tableauDeBordCsv(atelier), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tableau-de-bord-${atelier.code}.csv"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
