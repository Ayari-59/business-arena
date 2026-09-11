import { atelierByCode } from "@/config/ateliers";
import { cockpitAtelier } from "@/config/ateliers/cockpit-atelier";
import { rendreClasseur, XLSX_CONTENT_TYPE } from "@/lib/xlsx";

/**
 * Le cockpit de prévision d'un atelier, servi en classeur (.xlsx).
 *
 * Une prévision logistique et une prévision de résultat et de trésorerie,
 * référence par référence et tour par tour, qui se recalculent à chaque
 * hypothèse. Le classeur se construit dans le registre, où un test résout
 * chacune de ses formules vers l'intitulé qu'elle vise.
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

  const spec = cockpitAtelier(atelier);
  const fichier = await rendreClasseur(spec);
  return new Response(new Uint8Array(fichier), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${spec.fichier}-${atelier.code}.xlsx"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
