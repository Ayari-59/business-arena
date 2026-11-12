import { blocsDuChapitre, coursDeLaFormation, tableauDeCouverture } from "../couverture";
import { formationParCode, formationProposee, type Formation } from "../formations";
import { CHAPITRES_PROPOSES } from "../formations-proposees";
import { dureeDuChapitre } from "./duree";
import { couverteEnEntier } from "./matieres-en-entier";
import { parcoursDeFormationParCode } from "./parcours-a-choisir";
import { approfondissementsALaFin, pourAllerPlusLoin } from "./pour-aller-plus-loin";
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
 *    premier que le texte nomme : il ne paraît qu'une fois. Une entrée sans chapitre paraît
 *    aussi, vide et « en cours ». Un chapitre qui sert le diplôme
 *    par son parcours sans citer de bloc ferme la liste, sous « Autres chapitres ».
 *  · L'ORDRE D'APPRENTISSAGE : les prérequis des chapitres (`Chapitre.prerequis`) d'abord, puis
 *    l'année du programme quand le texte en a deux (la première, puis la terminale, au bac STMG),
 *    puis le palier, puis l'ordre du registre. Le rang est celui du parcours entier : un bloc peut
 *    commencer au rang 7, si ses chapitres demandent ceux d'un autre bloc. Les chapitres « pour
 *    aller plus loin » du diplôme (config/cours/pour-aller-plus-loin.ts) viennent après tous les
 *    autres : dans chaque bloc, ils ferment la liste.
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
  /**
   * Un chapitre de niveau supérieur, gardé pour ce diplôme comme un approfondissement (« pour aller plus
   * loin », config/cours/pour-aller-plus-loin.ts) : la page le marque et le range après les autres.
   */
  approfondissement: boolean;
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
 * L'ANNÉE D'UNE PARTIE DU PROGRAMME : 0 pour la première, 1 pour la terminale, 0 pour un texte qui
 * n'en a qu'une. Tous les chapitres du bac STMG sont au palier 1 : sans elle, leur rang suivait
 * l'ordre du registre, et le premier thème de première commençait au rang 16, après des chapitres
 * de mercatique de terminale (audit pédagogique du 11 novembre 2026, P2-11).
 */
export const anneeDeLaPartie = (partie: string | undefined) => (partie && /^Terminale\b/u.test(partie) ? 1 : 0);

/**
 * L'ORDRE D'APPRENTISSAGE : un tri topologique sur les prérequis internes au diplôme, qui
 * choisit à chaque pas le chapitre de la plus petite année du programme (`annee`, 0 par défaut),
 * puis de plus petit palier, puis le premier du registre. Un cycle (qui ne devrait pas exister)
 * n'arrête rien : ce qui reste suit l'année et le palier.
 */
export function ordreDApprentissage(chapitres: readonly Chapitre[], annee: (c: Chapitre) => number = () => 0): Chapitre[] {
  const index = new Map(CHAPITRES.map((c, i) => [c.code, i]));
  const avant = (a: Chapitre, b: Chapitre) =>
    annee(a) - annee(b) || a.palier - b.palier || (index.get(a.code) ?? 0) - (index.get(b.code) ?? 0);
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
  // Les entrées du texte, dans son ordre : l'entrée officielle quand le texte a été lu.
  const entrees = tableauDeCouverture(code).lignes.map((l) => ({
    bloc: l.couverture?.officiel ?? l.bloc,
    libelle: l.bloc,
    partie: l.partie,
    horsDuChamp: Boolean(l.horsDuChamp),
  }));
  // L'année d'un chapitre : celle de la première entrée du texte qu'il cite.
  const anneeDuChapitre = (c: Chapitre) => {
    const rangs = blocsDuChapitre(c, code).map((b) => entrees.findIndex((e) => e.bloc === b)).filter((r) => r >= 0);
    return rangs.length === 0 ? 0 : anneeDeLaPartie(entrees[Math.min(...rangs)]!.partie);
  };
  const ordre = approfondissementsALaFin(code, ordreDApprentissage(chapitres, anneeDuChapitre), (c) => c.code);
  const lignes: ChapitreDuDiplome[] = ordre.map((chapitre, i) => ({
    chapitre,
    rang: i + 1,
    duree: dureeDuChapitre(chapitre),
    approfondissement: pourAllerPlusLoin(code, chapitre.code),
    prerequis: (chapitre.prerequis ?? []).flatMap((p) => {
      const vu = CHAPITRES.find((c) => c.code === p);
      return vu ? [{ code: p, titre: vu.titre, dansLeDiplome: chapitres.some((c) => c.code === p) }] : [];
    }),
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
  // Toutes les entrées du texte paraissent, vides comprises (décision du propriétaire, novembre
  // 2026) : un thème sans chapitre se lit « en cours » au lieu de disparaître et de passer pour
  // couvert. Seule une entrée dite hors du champ (config/hors-du-champ.ts) reste absente quand
  // aucun chapitre ne la cite.
  const blocs: BlocDuParcours[] = entrees.flatMap((e, r) => {
    const c = parEntree.get(r) ?? [];
    if (c.length === 0 && e.horsDuChamp) return [];
    return [{ bloc: e.bloc, partie: e.partie, enCours: !couverteEnEntier(code, e.bloc, e.partie), chapitres: c }];
  });
  if (autres.length > 0) blocs.push({ bloc: null, enCours: false, chapitres: autres });
  return { formation, blocs, premier: lignes[0] ?? null };
}

/**
 * LES CHAPITRES D'UN PARCOURS QU'UNE CLASSE A CHOISI, DANS L'ORDRE D'APPRENTISSAGE (audit UX du
 * 11 novembre 2026, P1-1 à P1-3) : « Ma classe », le suivi de l'enseignant et sa liste de libération
 * les lisent dans cet ordre, et s'ouvrent sur le premier quand rien n'est libéré. Le cours d'un
 * diplôme suit l'ordre de sa page (`coursDuDiplome`, le rang) ; un parcours du registre, l'ordre
 * d'apprentissage de ses chapitres (`ordreDApprentissage`), retirés compris : une classe garde ce
 * qu'elle avait. Vide sans parcours.
 */
export function chapitresDuParcoursDansLOrdre(code: string | null | undefined): Chapitre[] {
  if (!code) return [];
  const diplome = parcoursDeFormationParCode(code)?.formation;
  if (diplome) {
    const cours = coursDuDiplome(diplome);
    return cours ? cours.blocs.flatMap((b) => b.chapitres).sort((a, b) => a.rang - b.rang).map((l) => l.chapitre) : [];
  }
  return ordreDApprentissage(CHAPITRES.filter((c) => c.parcours === code));
}

/**
 * L'EN-TÊTE DE LA PAGE D'UN DIPLÔME : CE QUE LE COURS COUVRE (audit du 10 novembre 2026,
 * produit P1-5). Il disait « 7 entrées sur 7 du référentiel travaillées par l'arène », la
 * couverture de l'arène et du cours réunis, au-dessus de matières marquées « en cours » : la
 * page qui doit dire ce que le cours couvre disait d'abord « tout est couvert ». Il compte
 * désormais les matières que les blocs de la page marquent : couvertes en entier
 * (config/cours/matieres-en-entier.ts) ou en cours, et celles qui n'ont pas encore de
 * chapitre. La couverture de l'arène reste au tableau de /parcours/…, entrée par entrée.
 */
export function couvertureDuCoursEnClair(cours: Pick<CoursDuDiplome, "blocs">): string {
  const matieres = cours.blocs.filter((b) => b.bloc !== null);
  const total = matieres.length;
  const entier = matieres.filter((b) => !b.enCours).length;
  const enCours = total - entier;
  const vides = matieres.filter((b) => b.enCours && b.chapitres.length === 0).length;
  const sansChapitre = vides > 0 ? `${vides} sans chapitre encore` : "";
  if (total === 0) return "Le cours ne travaille encore aucune matière de ce diplôme.";
  if (entier === total) return total === 1 ? "Le cours couvre en entier la matière de ce diplôme." : `Le cours couvre en entier les ${total} matières de ce diplôme.`;
  if (entier === 0) {
    const debut = total === 1 ? "La matière de ce diplôme n'est pas encore couverte en entier par le cours" : `Aucune des ${total} matières de ce diplôme n'est encore couverte en entier par le cours`;
    return `${debut}${sansChapitre ? ` ; ${sansChapitre}` : ""}.`;
  }
  return `Le cours couvre en entier ${entier} matière${entier > 1 ? "s" : ""} sur ${total} de ce diplôme ; ${enCours} en cours${
    sansChapitre ? `, dont ${sansChapitre}` : ""
  }.`;
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
