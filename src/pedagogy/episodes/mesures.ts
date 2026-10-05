/**
 * LES MESURES D'UNE PARTIE : qualité, robustesse, regret, chance.
 *
 * Le bilan dit si une décision était bonne. Ces mesures disent de combien, et
 * comment elle tient quand le hasard tourne mal. Chaque option d'une décision
 * est rejouée sous les trente tirages du bilan, les autres choix de la partie
 * inchangés. Le hasard d'un tirage ne dépend pas des décisions : toutes les
 * options sont jouées sous les mêmes imprévus, et la différence entre deux
 * options, tirage par tirage, tient tout entière à la décision.
 *
 *   · la QUALITÉ place l'espérance du choix entre la pire et la meilleure
 *     option, de 0 à 1 ; deux options presque à égalité au regard de l'enjeu
 *     (1 000 € au moins) sont toutes deux de bons choix ;
 *   · la ROBUSTESSE place de même son pire cas (le 10e centile, la 3e plus
 *     mauvaise valeur sur 30) entre le pire et le meilleur des pires cas ;
 *   · le REGRET, tirage par tirage, est ce que la meilleure option de ce
 *     tirage-là aurait rapporté de plus ;
 *   · les VICTOIRES sont la part des tirages où l'option fait mieux que la
 *     meilleure en moyenne : la mesure directe de ce que la chance peut faire
 *     croire.
 *
 * La qualité et la robustesse rangent chaque option dans une famille ; une
 * option TROMPEUSE bat la meilleure assez souvent pour qu'un manager jugé sur
 * son résultat apprenne le contraire de ce qu'il faut.
 *
 * Le résultat obtenu n'entre dans aucune de ces mesures, sauf la place du
 * tirage joué, qui dit justement la part de la chance. Tout est pur.
 */
import { GRAINES_DU_BILAN, moyenne, quantile } from "@/engine/episodes/commun";
import type { Episode, PartieJouee, Resultat } from "@/config/episodes/types";

/** Le seuil du bilan : au-delà, une décision est bonne. Il vaut aussi pour la robustesse. */
export const SEUIL_QUALITE = 0.7;
export const SEUIL_ROBUSTESSE = 0.7;
/**
 * Les deux seuils en euros suivent l'ENJEU de la décision : l'écart entre les bons et les
 * mauvais tirages de la meilleure option (son 90e moins son 10e centile), c'est-à-dire ce que
 * le hasard peut faire au trimestre. Un écart de 2 000 € compte quand le hasard en déplace
 * 30 000 ; il ne compte plus quand il en déplace 800 000, et payer 20 000 € pour se protéger
 * d'un tel hasard reste une prudence défendable. Les planchers gardent les petits épisodes
 * jugés comme avant.
 */
/** En deçà de cet écart à la meilleure option, deux options sont à égalité : 1 000 € au moins. */
export const EGALITE = 1000;
export const PART_D_EGALITE = 0.015;
/** L'option la plus sûre reste un bon choix tant qu'elle coûte moins que cela : 3 000 € au moins. */
export const PRIX_DE_LA_SECURITE = 3000;
export const PART_DE_LA_SECURITE = 0.05;

/** Le seuil d'égalité d'une décision dont la meilleure option va de p10 à p90. */
export const egalite = (p10: number, p90: number) =>
  Math.max(EGALITE, PART_D_EGALITE * (p90 - p10));
/** Ce que l'option la plus sûre peut coûter en espérance et rester un bon choix. */
export const prixDeLaSecurite = (p10: number, p90: number) =>
  Math.max(PRIX_DE_LA_SECURITE, PART_DE_LA_SECURITE * (p90 - p10));
/** Une option est trompeuse quand elle bat la meilleure sur au moins 30 % des tirages (9 sur 30). */
export const SEUIL_TROMPEUSE = 0.3;

/** Deux valeurs plus proches que cela sont égales : les simulations sont en euros. */
const EPS = 1e-9;

export type FamilleDOption = "robuste" | "fragile" | "prudente" | "faible";

export const FAMILLES_D_OPTION: Record<FamilleDOption, { nom: string; aide: string }> = {
  robuste: { nom: "Robuste", aide: "bonne en moyenne, et tient dans les mauvais tirages" },
  fragile: { nom: "Fragile", aide: "bonne en moyenne, mais exposée quand le hasard tourne mal" },
  prudente: { nom: "Prudente", aide: "protège des mauvais tirages, mais rapporte moins" },
  faible: { nom: "Faible", aide: "ni bonne en moyenne, ni protectrice" },
};

export interface OptionMesuree {
  option: number;
  /** L'objectif de l'épisode sous chacun des trente tirages, dans l'ordre des tirages. */
  valeurs: readonly number[];
  moyenne: number;
  /** Le pire cas : le 10e centile. */
  p10: number;
  /** Le meilleur cas : le 90e centile. */
  p90: number;
  /** De 0 (la pire option) à 1 (la meilleure, ou à égalité avec elle). */
  qualite: number;
  /** De 0 (le pire des pires cas) à 1 (le meilleur). */
  robustesse: number;
  /** Ce que la meilleure option de chaque tirage aurait rapporté de plus, en moyenne. */
  regret: number;
  /** La part des tirages où l'option fait mieux que la meilleure en moyenne. */
  victoires: number;
  famille: FamilleDOption;
  trompeuse: boolean;
}

export interface DecisionMesuree {
  d: number;
  /** L'option choisie dans la partie, et ses mesures. */
  choisie: OptionMesuree;
  /** La meilleure option en moyenne. */
  meilleure: OptionMesuree;
  /** L'option au meilleur pire cas. */
  plusSure: OptionMesuree;
  options: readonly OptionMesuree[];
  /** Payer un peu d'espérance pour se protéger : le choix est l'option la plus sûre, son pire cas est meilleur que celui de la meilleure, et elle coûte moins que le prix de la sécurité. */
  prudenceDefendable: boolean;
  /** Le jugement du bilan : une bonne décision. */
  bonne: boolean;
  /** Une option avait un meilleur pire cas que la meilleure : on pouvait choisir la sécurité. */
  securitePossible: boolean;
  /** La sécurité a été choisie : un meilleur pire cas que la meilleure option. */
  securiteChoisie: boolean;
  /** Sur chacun des trente tirages, aucune option ne fait mieux que la meilleure : la chance ne renverse rien. */
  dominee: boolean;
}

export interface MesuresDeLaPartie {
  decisions: readonly DecisionMesuree[];
  /** Le trimestre joué, rangé parmi les trente tirages joués avec les mêmes choix. */
  tirage: {
    obtenu: number;
    /** 1 : aucun des trente tirages ne fait mieux. */
    place: number;
    sur: number;
    /** Le résultat moyen des mêmes choix sur les trente tirages. */
    attendu: number;
  };
}

const position = (x: number, bas: number, haut: number) =>
  haut - bas < EPS ? 1 : Math.min(1, Math.max(0, (x - bas) / (haut - bas)));

/** Toutes les options d'une décision, rejouées sous les trente tirages, les autres choix inchangés. */
export function mesurerDecision<R extends Resultat>(
  ep: Pick<Episode<R>, "etapes" | "simuler">,
  chemin: readonly number[],
  d: number,
  jours: number,
): DecisionMesuree {
  const n = ep.etapes[d]!.options.length;
  const valeurs = Array.from({ length: n }, (_, k) => {
    const autre = [...chemin];
    autre[d] = k;
    return GRAINES_DU_BILAN.map((g) => ep.simuler(autre, g, jours).objectif);
  });
  const moyennes = valeurs.map(moyenne);
  const p10s = valeurs.map((v) => quantile(v, 0.1));
  const kMeilleure = moyennes.indexOf(Math.max(...moyennes));
  const kPlusSure = p10s.indexOf(Math.max(...p10s));
  const [pire, mieux] = [Math.min(...moyennes), moyennes[kMeilleure]!];
  const [p10Bas, p10Haut] = [Math.min(...p10s), Math.max(...p10s)];
  const enjeu = [quantile(valeurs[kMeilleure]!, 0.1), quantile(valeurs[kMeilleure]!, 0.9)] as const;
  const [seuilEgalite, prixSecurite] = [egalite(...enjeu), prixDeLaSecurite(...enjeu)];
  const meilleurDuTirage = GRAINES_DU_BILAN.map((_, t) => Math.max(...valeurs.map((v) => v[t]!)));

  const options = valeurs.map((v, k): OptionMesuree => {
    const qualite = mieux - moyennes[k]! < seuilEgalite ? 1 : position(moyennes[k]!, pire, mieux);
    const robustesse = position(p10s[k]!, p10Bas, p10Haut);
    const victoires = v.filter((x, t) => x > valeurs[kMeilleure]![t]! + EPS).length / v.length;
    const bonneMoyenne = qualite >= SEUIL_QUALITE;
    const tient = robustesse >= SEUIL_ROBUSTESSE;
    return {
      option: k,
      valeurs: v,
      moyenne: moyennes[k]!,
      p10: p10s[k]!,
      p90: quantile(v, 0.9),
      qualite,
      robustesse,
      regret: moyenne(v.map((x, t) => meilleurDuTirage[t]! - x)),
      victoires,
      famille: bonneMoyenne ? (tient ? "robuste" : "fragile") : tient ? "prudente" : "faible",
      trompeuse: moyennes[k]! < mieux - EPS && victoires >= SEUIL_TROMPEUSE - EPS,
    };
  });

  const choisie = options[chemin[d]!]!;
  const meilleure = options[kMeilleure]!;
  const plusSure = options[kPlusSure]!;
  const prudenceDefendable =
    choisie === plusSure &&
    choisie.p10 > meilleure.p10 + EPS &&
    meilleure.moyenne - choisie.moyenne < prixSecurite;
  return {
    d,
    choisie,
    meilleure,
    plusSure,
    options,
    prudenceDefendable,
    bonne: choisie.qualite >= SEUIL_QUALITE || prudenceDefendable,
    securitePossible: options.some((o) => o.p10 > meilleure.p10 + EPS),
    securiteChoisie: choisie.p10 > meilleure.p10 + EPS,
    dominee: options.every((o) => o.victoires === 0),
  };
}

/** Les mesures de chaque décision d'une partie, et la place du tirage joué. */
export function mesurer<R extends Resultat>(ep: Episode<R>, p: PartieJouee): MesuresDeLaPartie {
  const decisions = ep.etapes.map((_, d) => mesurerDecision(ep, p.chemin, d, p.jours));
  const obtenu = ep.simuler(p.chemin, p.graine, p.jours).objectif;
  const memesChoix = GRAINES_DU_BILAN.map((g) => ep.simuler(p.chemin, g, p.jours).objectif);
  return {
    decisions,
    tirage: {
      obtenu,
      place: Math.min(memesChoix.length, 1 + memesChoix.filter((v) => v > obtenu + EPS).length),
      sur: memesChoix.length,
      attendu: moyenne(memesChoix),
    },
  };
}
