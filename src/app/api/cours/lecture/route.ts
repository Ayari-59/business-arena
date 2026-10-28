import { casDeLEntreprise } from "@/config/cours/cas";
import { chapitreParCode } from "@/config/cours/registre";
import { chapitreDuCas } from "@/pedagogy/cours/deroule";
import { lireLeCurseur, lireLeLaboratoire, positionValide } from "@/pedagogy/cours/chapitre-servi";
import { chapitreOuvert } from "@/app/cours/acces";
import { ENTREPRISES } from "@/app/cours/entreprises";

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
    const position = positionValide(etape.leviers(cas), corps.position);
    if (!position) return Response.json({ refus: "position" }, { status: 400 });
    return Response.json(lireLeLaboratoire(etape, cas, position), sansCache);
  }
  return Response.json({ refus: "etape" }, { status: 404 });
}
