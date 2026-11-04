import { blocsDuChapitre, coursDeLaFormation, tableauDeCouverture } from "../couverture";
import { formationParCode, formationProposee, type Formation } from "../formations";
import { CHAPITRES_PROPOSES } from "../formations-proposees";
import { dureeDuChapitre } from "./duree";
import { couverteEnEntier } from "./matieres-en-entier";
import { CHAPITRES } from "./registre";
import { themeDuChapitre } from "./themes";
import type { Chapitre } from "./types";

/**
 * LE COURS D'UN DIPLÔME, DANS L'ORDRE D'APPRENTISSAGE ET BLOC PAR BLOC (chantier approuvé par
 * le propriétaire, novembre 2026 : « entrée par diplôme d'abord »).
 *
 * La page du cours entrait par le thème, et le diplôme n'était qu'un filtre qui rangeait ses
 * chapitres sous les thèmes du catalogue : un enseignant de BTS CG lisait « Comptabilité
 * générale », puis « Contrôle de gestion », sans retrouver les blocs de son référentiel ni
 * savoir par quel chapitre commencer. Il lit désormais son parcours :
 *
 *  · LES BLOCS DU RÉFÉRENTIEL, dans l'ordre du texte (config/couverture.ts,
 *    `tableauDeCouverture`). Un chapitre qui cite plusieurs blocs du diplôme se range sous le
 *    premier que le texte nomme : il ne paraît qu'une fois. Un chapitre qui sert le diplôme
 *    par son parcours sans citer de bloc ferme la liste, sous « Autres chapitres ».
 *  · L'ORDRE D'APPRENTISSAGE : les prérequis des chapitres (`Chapitre.prerequis`) d'abord, puis
 *    le palier, puis l'ordre du registre. Le rang est celui du parcours entier : un bloc peut
 *    commencer au rang 7, si ses chapitres demandent ceux d'un autre bloc.
 *
 * Rien ne s'y écrit à la main : la liste est celle de la couverture (`coursDeLaFormation`),
 * qui est aussi celle du programme compilé (config/cours/programme.ts).
 */

export interface ChapitreDuDiplome {
  chapitre: Chapitre;
  /** Le rang dans l'ordre d'apprentissage du diplôme, de 1 au nombre de chapitres. */
  rang: number;
  /** La durée indicative, en minutes (config/cours/duree.ts). */
  duree: number;
  /** Les chapitres à avoir vus avant, dans l'ordre où le chapitre les cite. */
  prerequis: readonly { code: string; titre: string; dansLeDiplome: boolean }[];
}

export interface BlocDuParcours {
  /** L'entrée du référentiel ; null pour les chapitres qui ne citent aucun bloc du diplôme. */
  bloc: string | null;
  /** Le programme dont l'entrée relève, quand le texte en réunit plusieurs. */
  partie?: string;
  /** Vrai si la matière n'est pas encore couverte en entier (config/cours/matieres-en-entier.ts). */
  enCours: boolean;
  chapitres: readonly ChapitreDuDiplome[];
}

export interface CoursDuDiplome {
  formation: Formation;
  blocs: readonly BlocDuParcours[];
  /** Le premier chapitre du parcours, celui par lequel commencer. */
  premier: ChapitreDuDiplome | null;
}

/**
 * L'ORDRE D'APPRENTISSAGE : un tri topologique sur les prérequis internes au diplôme, qui
 * choisit à chaque pas le chapitre de plus petit palier, puis le premier du registre. Un
 * cycle (qui ne devrait pas exister) n'arrête rien : ce qui reste suit le palier.
 */
export function ordreDApprentissage(chapitres: readonly Chapitre[]): Chapitre[] {
  const index = new Map(CHAPITRES.map((c, i) => [c.code, i]));
  const avant = (a: Chapitre, b: Chapitre) =>
    a.palier - b.palier || (index.get(a.code) ?? 0) - (index.get(b.code) ?? 0);
  const siens = new Set(chapitres.map((c) => c.code));
  const attend = new Map(chapitres.map((c) => [c.code, new Set((c.prerequis ?? []).filter((p) => siens.has(p) && p !== c.code))]));
  const restants = [...chapitres].sort(avant);
  const ordre: Chapitre[] = [];
  while (restants.length > 0) {
    const i = restants.findIndex((c) => attend.get(c.code)!.size === 0);
    const [suivant] = restants.splice(i >= 0 ? i : 0, 1);
    ordre.push(suivant!);
    for (const a of attend.values()) a.delete(suivant!.code);
  }
  return ordre;
}

export function coursDuDiplome(code: string): CoursDuDiplome | null {
  const formation = formationParCode(code);
  if (!formation || !formationProposee(code)) return null;
  const chapitres = coursDeLaFormation(code).flatMap((g) => g.chapitres);
  const ordre = ordreDApprentissage(chapitres);
  const lignes: ChapitreDuDiplome[] = ordre.map((chapitre, i) => ({
    chapitre,
    rang: i + 1,
    duree: dureeDuChapitre(chapitre),
    prerequis: (chapitre.prerequis ?? []).flatMap((p) => {
      const vu = CHAPITRES.find((c) => c.code === p);
      return vu ? [{ code: p, titre: vu.titre, dansLeDiplome: chapitres.some((c) => c.code === p) }] : [];
    }),
  }));

  // Les entrées du texte, dans son ordre : l'entrée officielle quand le texte a été lu.
  const entrees = tableauDeCouverture(code).lignes.map((l) => ({
    bloc: l.couverture?.officiel ?? l.bloc,
    libelle: l.bloc,
    partie: l.partie,
  }));
  const parEntree = new Map<number, ChapitreDuDiplome[]>();
  const autres: ChapitreDuDiplome[] = [];
  for (const ligne of lignes) {
    const cites = blocsDuChapitre(ligne.chapitre, code);
    const rangs = cites.map((b) => entrees.findIndex((e) => e.bloc === b)).filter((r) => r >= 0);
    if (rangs.length === 0) {
      autres.push(ligne);
      continue;
    }
    const premier = Math.min(...rangs);
    parEntree.set(premier, [...(parEntree.get(premier) ?? []), ligne]);
  }
  const blocs: BlocDuParcours[] = [...parEntree]
    .sort(([a], [b]) => a - b)
    .map(([r, c]) => ({
      bloc: entrees[r]!.bloc,
      partie: entrees[r]!.partie,
      enCours: !couverteEnEntier(code, entrees[r]!.bloc, entrees[r]!.partie),
      chapitres: c,
    }));
  if (autres.length > 0) blocs.push({ bloc: null, enCours: false, chapitres: autres });
  return { formation, blocs, premier: lignes[0] ?? null };
}

/** Le texte sans accents ni capitales : « Trésorerie » se trouve en tapant « tresorerie ». */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * LA RECHERCHE PAR MOT-CLÉ : un chapitre est trouvé quand chacun des mots tapés se lit dans
 * son titre, son accroche, ses objectifs ou le titre de son thème. Rien n'est tapé : rien
 * n'est trouvé (la page montre alors son entrée par diplôme). `parmi` restreint la
 * recherche aux chapitres d'un diplôme.
 */
export function rechercherChapitres(motCle: string, parmi?: readonly Chapitre[]): Chapitre[] {
  const mots = normaliser(motCle).split(/[^a-z0-9]+/).filter((m) => m.length > 1);
  if (mots.length === 0) return [];
  return (parmi ?? CHAPITRES_PROPOSES).filter((c) => {
    const texte = normaliser([c.titre, c.accroche, ...c.objectifs, themeDuChapitre(c.code)?.titre ?? ""].join(" "));
    return mots.every((m) => texte.includes(m));
  });
}
