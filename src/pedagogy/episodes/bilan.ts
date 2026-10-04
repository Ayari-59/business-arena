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
import { GRAINES_DU_BILAN, moyenne, rejouerAvec, type Rejeu } from "@/engine/episodes/commun";
import type { Constat, Episode, Etape, PartieJouee, Resultat } from "@/config/episodes/types";

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

export interface Analyse<R extends Resultat = Resultat> {
  trimestre: R;
  /** Le résultat moyen des choix du joueur sur les trente tirages. */
  attendu: number;
  decisions: DecisionAnalysee[];
  references: { nom: string; valeur: number }[];
}

/**
 * Une décision est BONNE quand elle capte au moins 70 % de l'écart entre la
 * pire et la meilleure option, ou qu'elle est à moins de 1 000 € de la
 * meilleure : deux options presque à égalité sont toutes deux de bons choix.
 * L'option la PLUS SÛRE l'est aussi tant qu'elle reste à moins de 3 000 € de
 * la meilleure : payer un peu d'espérance pour se protéger d'un mauvais
 * tirage est une décision défendable, pas une erreur.
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
      efficacite >= 0.7 ||
      meilleur.attendu - pris.attendu < 1000 ||
      (pris === plusSur && meilleur.attendu - pris.attendu < 3000);
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
  return { trimestre, attendu, decisions, references };
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
