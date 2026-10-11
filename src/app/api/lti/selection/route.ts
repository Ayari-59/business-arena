import { origineDeLaRequete } from "@/lib/origine";
import { LtiNonConfigure } from "@/lti/cles";
import { journaliserRefus } from "@/lti/journal";
import { pageLti } from "@/lti/html";
import { reponseDeSelection, SelectionRefusee } from "@/lti/selection";

/**
 * LE CHOIX DE L'ENSEIGNANT dans l'écran de sélection de contenu : le ticket de la
 * sélection (usage unique) et la cible. La réponse renvoie à la plateforme le jeton
 * signé `LtiDeepLinkingResponse` (lti/selection.ts).
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    form = new FormData();
  }
  const champ = (c: string) => {
    const v = form.get(c);
    return typeof v === "string" ? v : null;
  };
  try {
    return await reponseDeSelection({ ticket: champ("ticket"), cible: champ("cible"), origine: await origineDeLaRequete() });
  } catch (e) {
    if (e instanceof LtiNonConfigure) {
      return pageLti({ titre: "LTI n'est pas encore configuré", statut: 503, integrablePar: ["*"], corps: "<p>Prévenez l'administrateur de Business Arena.</p>" });
    }
    if (!(e instanceof SelectionRefusee)) throw e;
    await journaliserRefus({ etape: "selection", motif: e.motif });
    return pageLti({
      titre: "Ce choix n'a pas pu être enregistré",
      statut: 400,
      integrablePar: ["*"],
      corps: "<p>L'écran de sélection a expiré ou a déjà servi. Relancez « Sélectionner le contenu » depuis votre cours.</p>",
    });
  }
}
