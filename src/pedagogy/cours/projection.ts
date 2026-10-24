import type { Cas } from "../../config/cours/cas";
import type { Chapitre } from "../../config/cours/types";
import { chapitreDuCas, etatAvant } from "./deroule";
import { duPremierCoup, REMARQUES_PAR_ETAPE, type ProgressionLue } from "./suivi";

/**
 * UNE ÉTAPE DU COURS, AU MUR : CE QUE LA CLASSE A RÉPONDU.
 *
 * Pour l'étape projetée : combien d'élèves l'ont atteinte, réussie du premier coup, après une
 * erreur, ou avec la correction ; pour une question à choix, combien ont choisi chaque
 * réponse ; pour les autres, les remarques du correcteur qui reviennent le plus. Aucun nom :
 * la projection se lit devant la classe.
 *
 * LES ENTREPRISES DIFFÈRENT, LES RÉPONSES SE COMPTENT ENSEMBLE. Une question à choix garde
 * l'ordre de ses réponses d'une entreprise à l'autre, mais leurs montants changent : la
 * réponse d'un élève se reconnaît dans les options de SON entreprise (le correcteur a gardé
 * « A répondu : « … » »), puis se compte à sa place dans la liste.
 */

export interface ReponseProjetee {
  texte: string;
  juste: boolean;
  /** Les élèves qui l'ont choisie au moins une fois. */
  eleves: number;
}

export interface EtapeProjetee {
  id: string;
  titre: string;
  type: Chapitre["etapes"][number]["type"];
  /** Ce que l'étape demande, dans l'entreprise de la projection. */
  question: string;
  /** Sa place dans le chapitre tel que la classe le voit (1 à `total`). */
  numero: number;
  total: number;
  eleves: number;
  atteinte: number;
  premierCoup: number;
  apresErreur: number;
  aidees: number;
  /** Ceux qui l'ont atteinte et ne l'ont pas encore réussie. */
  enCours: number;
  /** Pour une question à choix : chaque réponse, dans l'ordre du chapitre. */
  reponses: ReponseProjetee[] | null;
  /** Pour les autres étapes notées : les remarques les plus fréquentes. */
  remarques: { texte: string; eleves: number }[];
}

const A_REPONDU = /^A répondu : « (.*) »$/;

/**
 * L'étape `id` du chapitre, telle que la classe l'a vécue. La page la montre dans l'entreprise
 * `cas` (celle de la classe, ou la première) ; chaque élève est lu dans le chapitre de son
 * entreprise, où l'étape peut avoir une autre place, ou ne pas exister.
 */
export function projectionDeLEtape(args: {
  chapitre: Chapitre;
  cas: Cas;
  id: string;
  progressions: readonly ProgressionLue[];
  casDe: (entreprise: string) => Cas | null;
}): EtapeProjetee | null {
  const { cas, id, progressions, casDe } = args;
  const chapitre = chapitreDuCas(args.chapitre, cas);
  const index = chapitre.etapes.findIndex((e) => e.id === id);
  if (index < 0) return null;
  const etape = chapitre.etapes[index]!;
  // Chaque élève, avec la place de l'étape dans le chapitre de son entreprise.
  const lus = progressions.flatMap((p) => {
    const sonCas = casDe(p.entreprise);
    if (!sonCas) return [];
    const sien = chapitreDuCas(args.chapitre, sonCas);
    const place = sien.etapes.findIndex((e) => e.id === id);
    return place < 0 ? [] : [{ p, cas: sonCas, chapitre: sien, place }];
  });
  const suivi = (p: ProgressionLue) => p.etapes[id];
  const atteinte = lus.filter(({ p, place }) => p.etape >= place || suivi(p)).length;
  const premierCoup = lus.filter(({ p }) => duPremierCoup(suivi(p)) || (etape.type === "lecture" && suivi(p)?.reussi)).length;
  const aidees = lus.filter(({ p }) => suivi(p)?.aide).length;
  const reussies = lus.filter(({ p }) => suivi(p)?.reussi).length;

  let reponses: ReponseProjetee[] | null = null;
  if (etape.type === "choix") {
    // Les options se lisent dans l'état du journal où l'élève les a vues.
    const options = etape.options(cas, etatAvant(chapitre, cas, index));
    const compte = options.map(() => new Set<number>());
    lus.forEach(({ p, cas: sonCas, chapitre: sien, place }, k) => {
      const sienne = sien.etapes[place];
      if (sienne?.type !== "choix") return;
      const siennes = sienne.options(sonCas, etatAvant(sien, sonCas, place));
      for (const r of p.erreurs[id] ?? []) {
        const texte = A_REPONDU.exec(r)?.[1];
        const i = texte === undefined ? -1 : siennes.findIndex((o) => o.texte === texte);
        if (i >= 0 && i < compte.length) compte[i]!.add(k);
      }
      // La bonne réponse : celle qu'il a trouvée lui-même, sans la correction.
      const s = suivi(p);
      if (s?.reussi && !s.aide) {
        const juste = siennes.findIndex((o) => o.juste);
        if (juste >= 0 && juste < compte.length) compte[juste]!.add(k);
      }
    });
    reponses = options.map((o, i) => ({ texte: o.texte, juste: o.juste, eleves: compte[i]!.size }));
  }

  const parRemarque = new Map<string, Set<number>>();
  if (etape.type !== "choix") {
    lus.forEach(({ p }, k) => {
      for (const r of p.erreurs[id] ?? []) parRemarque.set(r, (parRemarque.get(r) ?? new Set()).add(k));
    });
  }
  const remarques = [...parRemarque.entries()]
    .map(([texte, qui]) => ({ texte, eleves: qui.size }))
    .sort((a, b) => b.eleves - a.eleves || a.texte.localeCompare(b.texte, "fr"))
    .slice(0, REMARQUES_PAR_ETAPE);

  const etat = etatAvant(chapitre, cas, index);
  const question =
    etape.type === "lecture"
      ? (etape.texte(cas)[0] ?? "")
      : etape.type === "ecriture"
        ? etape.evenement(cas)
        : etape.type === "choix" || etape.type === "montants"
          ? etape.question(cas, etat)
          : etape.question(cas);

  return {
    id,
    titre: etape.titre,
    type: etape.type,
    question,
    numero: index + 1,
    total: chapitre.etapes.length,
    eleves: lus.length,
    atteinte,
    premierCoup,
    apresErreur: Math.max(0, reussies - aidees - (etape.type === "lecture" ? reussies : premierCoup)),
    aidees,
    enCours: Math.max(0, atteinte - reussies),
    reponses,
    remarques,
  };
}
