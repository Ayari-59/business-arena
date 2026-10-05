/**
 * LE BILAN D'UN ÉPISODE : séparer la qualité d'une décision de son résultat.
 *
 * Un trimestre réussi ne prouve pas qu'on a bien décidé, et un trimestre raté
 * ne prouve pas le contraire. Le bilan rejoue donc chaque décision sous trente
 * tirages du même hasard, les autres choix inchangés :
 *
 *   · la QUALITÉ d'une décision se lit sur la moyenne des trente tirages ;
 *   · la CHANCE, sur l'écart entre ce que le joueur a vécu dans la fenêtre de
 *     semaines que la décision couvre et ce qu'il aurait vécu en moyenne.
 *
 * Les deux se croisent en quatre cas — mérité, malchance, chance, leçon — qui
 * sont la seule chose que le joueur doit emporter : la case « chance » est
 * celle d'une décision à ne pas refaire, même si elle a payé.
 *
 * L'analyse est la même pour tous les épisodes : elle ne connaît que la
 * simulation, les fenêtres et les références que chacun déclare. Tout est
 * pur : le même état de partie donne le même bilan.
 */
import {
  GRAINES_DU_BILAN,
  moyenne,
  quantile,
  rejouerAvec,
  type Rejeu,
} from "@/engine/episodes/commun";
import type { Constat, Episode, Etape, PartieJouee, Resultat } from "@/config/episodes/types";
import { SEUIL_QUALITE, egalite, prixDeLaSecurite } from "@/pedagogy/episodes/mesures";

export type Cas = "bonne-fav" | "bonne-defav" | "faible-fav" | "faible-defav";

export const CAS: Record<Cas, { nom: string; aide: string }> = {
  "bonne-fav": { nom: "Mérité", aide: "bonne décision, bon résultat" },
  "bonne-defav": { nom: "Malchance", aide: "bonne décision, à refaire quand même" },
  "faible-fav": { nom: "Chance", aide: "décision faible, à ne pas refaire" },
  "faible-defav": { nom: "Leçon", aide: "décision faible, résultat faible" },
};

export interface DecisionAnalysee {
  d: number;
  e: Etape;
  pris: Rejeu;
  meilleur: Rejeu;
  /** L'option qui protège le mieux dans les mauvais tirages. */
  plusSur: Rejeu;
  rang: number;
  n: number;
  bonne: boolean;
  favorable: boolean;
  cas: Cas;
}

/**
 * L'ENCHAÎNEMENT : quand les décisions, jugées une à une, semblent bonnes alors
 * que la partie finit loin de la méthode.
 *
 * Chaque décision est jugée dans la situation que les précédentes ont créée.
 * Après un premier réflexe, le suivant devient souvent la réponse la plus
 * raisonnable : lancer partout appelle des artisans partout, et l'exclusivité
 * du fabricant. Le détail décision par décision juge alors bonnes des décisions
 * qui n'en sont pas, ou n'explique qu'une petite part de l'écart à la méthode ;
 * le reste tient à l'enchaînement. On le montre
 * en reprenant la méthode à partir de chaque décision où la partie s'en écarte.
 */
export interface Enchainement {
  methode: string;
  /** Ce que la méthode fait de plus que les choix du joueur, en moyenne sur trente tirages. */
  ecart: number;
  /** La part que le détail décision par décision explique : la somme des écarts à la meilleure option. */
  explique: number;
  /** Ce que reprendre la méthode à partir de cette décision aurait rapporté de plus, en moyenne. */
  reprises: { d: number; gain: number }[];
}

export interface Analyse<R extends Resultat = Resultat> {
  trimestre: R;
  /** Le résultat moyen des choix du joueur sur les trente tirages. */
  attendu: number;
  decisions: DecisionAnalysee[];
  references: { nom: string; valeur: number }[];
  /**
   * Présent quand la partie finit loin de la méthode alors que le détail des décisions
   * en explique moins de la moitié, ou juge bonnes la moitié des décisions qui s'en écartent.
   */
  enchainement: Enchainement | null;
}

/** L'enchaînement d'une partie, ou `null` si le détail des décisions suffit à l'expliquer. */
export function enchainement(
  ep: Pick<Episode, "references" | "simuler">,
  p: Pick<PartieJouee, "chemin" | "jours">,
  attendu: number,
  decisions: readonly Pick<DecisionAnalysee, "d" | "bonne" | "meilleur" | "pris">[],
): Enchainement | null {
  const methode = ep.references[0]!;
  const enMoyenne = (c: readonly number[]) =>
    moyenne(GRAINES_DU_BILAN.map((g) => ep.simuler(c, g, p.jours).objectif));
  const tirages = GRAINES_DU_BILAN.map((g) => ep.simuler(methode.chemin, g, p.jours).objectif);
  const ecart = moyenne(tirages) - attendu;
  const seuil = prixDeLaSecurite(quantile(tirages, 0.1), quantile(tirages, 0.9));
  const explique = decisions.reduce((t, x) => t + x.meilleur.attendu - x.pris.attendu, 0);
  const ecartees = decisions.filter((x) => p.chemin[x.d] !== methode.chemin[x.d]);
  const jugeesBonnes = ecartees.filter((x) => x.bonne).length;
  if (ecart < seuil || (explique >= ecart / 2 && jugeesBonnes * 2 < ecartees.length)) return null;
  const reprises = p.chemin.flatMap((choix, d) =>
    choix === methode.chemin[d]
      ? []
      : [{ d, gain: enMoyenne([...p.chemin.slice(0, d), ...methode.chemin.slice(d)]) - attendu }],
  );
  return { methode: methode.nom, ecart, explique, reprises };
}

/**
 * Une décision est BONNE quand elle capte au moins 70 % de l'écart entre la
 * pire et la meilleure option, ou qu'elle est presque à égalité avec la
 * meilleure : deux options proches sont toutes deux de bons choix. L'option la
 * PLUS SÛRE l'est aussi tant qu'elle coûte peu en espérance : payer un peu pour
 * se protéger d'un mauvais tirage est une décision défendable, pas une erreur,
 * pourvu qu'elle protège vraiment : un pire cas meilleur que celui de la meilleure.
 * « Proche » et « peu » se mesurent à l'enjeu de la décision, ce que le hasard
 * fait varier la meilleure option (voir `egalite` et `prixDeLaSecurite`).
 */
export function analyser<R extends Resultat>(ep: Episode<R>, p: PartieJouee): Analyse<R> {
  const objectif = (c: readonly number[], g: number) => ep.simuler(c, g, p.jours).objectif;
  const trimestre = ep.simuler(p.chemin, p.graine, p.jours);
  const attendu = moyenne(GRAINES_DU_BILAN.map((g) => objectif(p.chemin, g)));
  const decisions = ep.etapes.map((e, d): DecisionAnalysee => {
    const options = rejouerAvec(objectif, p.chemin, d, e.options.length);
    const tri = [...options].sort((a, b) => b.attendu - a.attendu);
    const pris = options[p.chemin[d]!]!;
    const meilleur = tri[0]!;
    const pire = tri.at(-1)!;
    const efficacite = (pris.attendu - pire.attendu) / Math.max(1, meilleur.attendu - pire.attendu);
    const plusSur = options.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    const bonne =
      efficacite >= SEUIL_QUALITE ||
      meilleur.attendu - pris.attendu < egalite(meilleur.p10, meilleur.p90) ||
      (pris === plusSur &&
        pris.p10 > meilleur.p10 + 1e-9 &&
        meilleur.attendu - pris.attendu < prixDeLaSecurite(meilleur.p10, meilleur.p90));
    const vecu = ep.bilan.fenetre(trimestre, d);
    const enMoyenne = moyenne(
      GRAINES_DU_BILAN.map((g) => ep.bilan.fenetre(ep.simuler(p.chemin, g, p.jours), d)),
    );
    const favorable = vecu >= enMoyenne;
    return {
      d,
      e,
      pris,
      meilleur,
      plusSur,
      rang: tri.indexOf(pris) + 1,
      n: options.length,
      bonne,
      favorable,
      cas: `${bonne ? "bonne" : "faible"}-${favorable ? "fav" : "defav"}`,
    };
  });
  const references = ep.references.map((r) => ({
    nom: r.nom,
    valeur: objectif(r.chemin, p.graine),
  }));
  return {
    trimestre,
    attendu,
    decisions,
    references,
    enchainement: enchainement(ep, p, attendu, decisions),
  };
}

/* ---------------------------------------------------------------------------
 * LES CONSTATS QUE TOUS LES ÉPISODES PARTAGENT.
 * ------------------------------------------------------------------------- */

export const nombre = (v: number, d = 1) => v.toLocaleString("fr-FR", { maximumFractionDigits: d });

/** Les informations sans lesquelles chaque décision se prend à l'aveugle. */
export const decisives = (ep: Pick<Episode, "etapes">): readonly (readonly string[])[] =>
  ep.etapes.map((e) => e.sources.filter((s) => s.nature === "decisive").map((s) => s.id));

/** Combien d'informations décisives le joueur a ouvertes avant de décider. */
export function constatInformation(
  ep: Pick<Episode, "etapes">,
  p: PartieJouee,
  debut: string,
): Constat {
  const ids = decisives(ep);
  const total = ids.flat().length;
  const vues = ids.reduce(
    (s, liste, i) => s + liste.filter((id) => p.consultes[i]?.includes(id)).length,
    0,
  );
  const toutesAuDebut = ids[0]!.every((id) => p.consultes[0]?.includes(id));
  return {
    score: vues / total,
    texte: `Avant de décider, vous avez consulté ${vues} des ${total} informations décisives${
      toutesAuDebut ? `, dont ${debut}` : ""
    }.`,
  };
}

/** L'écart entre la prévision chiffrée et le réalisé, et la confiance qu'on y mettait. */
export function constatCalibrage(
  p: PartieJouee,
  reel: number,
  quoi: string,
  unite: string,
  seuils: { juste: number; proche: number },
  /** « 3,5 points », « 1,2 jour » : l'écart dit dans son unité. */
  ecartEn: (ecart: number) => string,
): Constat {
  const ecart = Math.abs(p.prevision - reel);
  const tropSur = ecart > seuils.proche && p.confiance >= 70;
  return {
    score: ecart <= seuils.juste ? 1 : ecart <= seuils.proche ? 0.6 : 0,
    texte: `Vous aviez prévu ${nombre(p.prevision)} ${unite} ${quoi}, avec une confiance de ${p.confiance} % ; réalisé : ${nombre(reel)} ${unite}, soit un écart de ${ecartEn(ecart)}${
      tropSur ? ". Votre confiance était plus forte que votre précision" : ""
    }.`,
  };
}
