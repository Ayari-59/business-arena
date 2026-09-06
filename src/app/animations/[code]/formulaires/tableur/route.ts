import { atelierByCode } from "@/config/ateliers";
import { formulairesCsv } from "@/config/ateliers/formulaires";

/**
 * Les formulaires des livrables, servis en tableur.
 *
 * La feuille imprimée se remplit au stylo pendant la séance ; ce fichier se
 * remplit au clavier et se rend par courrier. Aucune formule : un livrable se
 * rédige, il ne se calcule pas.
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

  return new Response(formulairesCsv(atelier), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="livrables-${atelier.code}.csv"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
