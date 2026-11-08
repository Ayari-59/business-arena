import { casDeLEntreprise } from "@/config/cours/cas";
import { chapitreParCode } from "@/config/cours/registre";
import { chapitreDuCas } from "@/pedagogy/cours/deroule";
import { lireLeCurseur, lireLeLaboratoire, positionValide, solutionDuLaboratoire } from "@/pedagogy/cours/chapitre-servi";
import { ESSAIS_AVANT_LA_SOLUTION, essaisDuJeton, signerLesEssais } from "@/pedagogy/cours/essais-du-laboratoire";
import { chapitreOuvert } from "@/app/cours/acces";
import { ENTREPRISES } from "@/app/cours/entreprises";
import { getSession } from "@/lib/session";

/**
 * CE QUE MONTRE UNE SIMULATION À UNE POSITION (audit, P0).
 *
 * Le curseur et les leviers du laboratoire se lisent au serveur : leurs formules sont
 * le contenu du chapitre, qui ne part pas au navigateur (pedagogy/cours/chapitre-servi.ts).
 * Le guide envoie la position ; la réponse est la lecture, après le même contrôle de
 * licence que la page. Une route plutôt qu'une action serveur : les actions passent une
 * à une, et un curseur qu'on glisse en demande beaucoup ; une lecture ne change rien.
 *
 * Corps : { chapitre, entreprise, etape, quantite } pour un curseur,
 *         { chapitre, entreprise, etape, position } pour un laboratoire.
 *
 * LE LABORATOIRE NE SERT PLUS SA SOLUTION AVEC LA PAGE (décision du propriétaire, novembre 2026) :
 * - { …, geste: "valider", position, jeton? } valide une position : la lecture (l'explication si le
 *   défi est relevé), et un jeton signé qui compte les validations de ce laboratoire
 *   (pedagogy/cours/essais-du-laboratoire.ts), à renvoyer avec la suivante ;
 * - { …, geste: "montrer", jeton?, classe? } rend la solution et sa lecture, seulement après deux
 *   validations (le jeton le dit), ou tout de suite à l'enseignant connecté qui projette en mode
 *   classe. Sinon, 403 : la règle se vérifie ici, pas dans le navigateur.
 */
export async function POST(request: Request) {
  let corps: Record<string, unknown>;
  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ refus: "corps" }, { status: 400 });
  }
  const chapitre = typeof corps.chapitre === "string" ? chapitreParCode(corps.chapitre) : undefined;
  if (!chapitre) return Response.json({ refus: "chapitre" }, { status: 404 });
  const entreprise = ENTREPRISES.find(
    (e) => e.code === corps.entreprise && (!chapitre.entreprises || chapitre.entreprises.codes.includes(e.code)),
  );
  if (!entreprise) return Response.json({ refus: "entreprise" }, { status: 400 });
  if (!(await chapitreOuvert(chapitre))) return Response.json({ refus: "licence" }, { status: 403 });

  const cas = casDeLEntreprise(entreprise.code);
  const etape = chapitreDuCas(chapitre, cas).etapes.find((e) => e.id === corps.etape);
  const sansCache = { headers: { "cache-control": "private, no-store" } };
  if (etape?.type === "curseur") {
    const { max, min = 0 } = etape.cible(cas);
    const q = corps.quantite;
    if (typeof q !== "number" || !Number.isInteger(q) || q < min || q > max) return Response.json({ refus: "position" }, { status: 400 });
    return Response.json(lireLeCurseur(etape, cas, q), sansCache);
  }
  if (etape?.type === "simulation") {
    const lieu = { chapitre: chapitre.code, entreprise: entreprise.code, etape: etape.id };
    if (corps.geste === "montrer") {
      const enClasse = corps.classe === true && (await getSession()) !== null;
      if (!enClasse && essaisDuJeton(corps.jeton, lieu) < ESSAIS_AVANT_LA_SOLUTION) return Response.json({ refus: "essais" }, { status: 403 });
      return Response.json(solutionDuLaboratoire(chapitre, cas, etape.id), sansCache);
    }
    const position = positionValide(etape.leviers(cas), corps.position);
    if (!position) return Response.json({ refus: "position" }, { status: 400 });
    const lecture = lireLeLaboratoire(etape, cas, position);
    if (corps.geste === "valider") return Response.json({ ...lecture, jeton: signerLesEssais(lieu, essaisDuJeton(corps.jeton, lieu) + 1) }, sansCache);
    return Response.json(lecture, sansCache);
  }
  return Response.json({ refus: "etape" }, { status: 404 });
}
