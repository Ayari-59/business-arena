import { casDeLEntreprise } from "@/config/cours/cas";
import { TYPE_PPTX, aSonDiaporama, fichierDuDiaporama } from "@/config/cours/diaporamas";
import { chapitreParCode } from "@/config/cours/registre";
import { competencesAffichees, diplomeDeLAdresse } from "@/config/cours/competences-affichees";
import { diaporamaDuChapitre } from "@/pedagogy/cours/diaporama";
import { diaporamaPermis } from "../../acces";
import { ENTREPRISES } from "../../entreprises";

/**
 * LE DIAPORAMA D'UN CHAPITRE, FABRIQUÉ À LA DEMANDE (config/cours/diaporamas.ts,
 * pedagogy/cours/diaporama.ts). Il porte les corrigés : la route refait elle-même le contrôle
 * d'accès de la page (../../acces.ts, `diaporamaPermis`), le bouton caché ne protège rien.
 *
 * 404 : un chapitre inconnu, ou qui n'a pas de diaporama. 403 : un visiteur, un élève, un enseignant
 * sans licence ou à qui ce chapitre n'est pas ouvert. `?entreprise=` choisit le cas, parmi les
 * entreprises du chapitre ; la première sinon, comme la page.
 */
export async function GET(request: Request, { params }: { params: Promise<{ chapitre: string }> }) {
  const { chapitre: code } = await params;
  const chapitre = chapitreParCode(code);
  if (!chapitre || !aSonDiaporama(chapitre.code)) return new Response("Ce chapitre n'a pas de diaporama.", { status: 404 });
  if (!(await diaporamaPermis(chapitre))) {
    return new Response("Le diaporama est réservé aux enseignants dont l'établissement a la licence de ce chapitre.", {
      status: 403,
      headers: { "cache-control": "private, no-store" },
    });
  }
  const possibles = ENTREPRISES.filter((e) => !chapitre.entreprises || chapitre.entreprises.codes.includes(e.code));
  const adresse = new URL(request.url).searchParams;
  const demandee = adresse.get("entreprise");
  const entreprise = possibles.find((e) => e.code === demandee) ?? possibles[0]!;
  // Les compétences du diplôme d'où vient l'enseignant (`?diplome=`), sinon celles du diplôme du
  // chapitre, comme sur sa page (config/cours/competences-affichees.ts).
  const competences = competencesAffichees(chapitre, { demande: diplomeDeLAdresse(adresse.get("diplome")) });
  const fichier = await diaporamaDuChapitre(chapitre, casDeLEntreprise(entreprise.code), competences);
  return new Response(new Uint8Array(fichier), {
    status: 200,
    headers: {
      "content-type": TYPE_PPTX,
      "content-disposition": `attachment; filename="${fichierDuDiaporama(chapitre.code)}"`,
      "cache-control": "private, no-store",
    },
  });
}
