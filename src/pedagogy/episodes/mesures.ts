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
 *     option, de 0 à 1 ; deux options à moins de 1 000 € l'une de l'autre
 *     sont toutes deux de bons choix ;
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
/** En deçà de cet écart à la meilleure option, en euros, deux options sont à égalité. */
export const EGALITE = 1000;
/** L'option la plus sûre reste un bon choix tant qu'elle coûte moins que cela en espérance. */
export const PRIX_DE_LA_SECURITE = 3000;
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
  /** De 0 (la pire option) à 1 (la meilleure, ou à moins de 1 000 € d'elle). */
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
  /** Payer un peu d'espérance pour se protéger : le choix est l'option la plus sûre, à moins de 3 000 €. */
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
  const meilleurDuTirage = GRAINES_DU_BILAN.map((_, t) => Math.max(...valeurs.map((v) => v[t]!)));

  const options = valeurs.map((v, k): OptionMesuree => {
    const qualite = mieux - moyennes[k]! < EGALITE ? 1 : position(moyennes[k]!, pire, mieux);
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
    choisie === plusSure && meilleure.moyenne - choisie.moyenne < PRIX_DE_LA_SECURITE;
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
