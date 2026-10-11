/**
 * MÉRITE OU CHANCE : ce que les décisions d'une partie solo valaient, tirage
 * mis à part.
 *
 * Le bilan de l'arène disait ce qui s'était passé. Une partie se joue pourtant
 * sous UN marché : un bon résultat ne prouve pas qu'on a bien décidé, un
 * mauvais ne prouve pas le contraire. Comme les épisodes manager
 * (`pedagogy/episodes/bilan.ts`), on rejoue donc les décisions du joueur,
 * telles quelles, sous trente marchés possibles (`rejeu.ts`), et la méthode de
 * référence sous les MÊMES trente marchés (`reference.ts`). Sous un même
 * marché, la différence entre les deux tient aux décisions.
 *
 * LE CRITÈRE est le résultat net cumulé de la partie : ce que les décisions ont
 * rapporté. L'IPG et le rang sont montrés, mais ne jugent pas : l'IPG mêle les
 * réponses aux situations (que la méthode ne joue pas) et un rang relatif aux
 * bots, dont le tempérament change d'un marché à l'autre.
 *
 * LA MATRICE, dans le vocabulaire des épisodes :
 *
 *                          marché joué favorable     marché joué défavorable
 *   décisions solides      Mérité                    Malchance
 *   décisions fragiles     Chance                    Leçon
 *
 *   · des décisions sont SOLIDES quand elles font mieux que la référence sur
 *     au moins deux marchés possibles sur trois (`SEUIL_DES_DECISIONS_SOLIDES`) :
 *     la majorité simple laisserait un pile ou face passer pour une méthode ;
 *   · le marché joué est FAVORABLE quand il place le résultat obtenu dans la
 *     meilleure moitié des trente résultats que les mêmes décisions donnent
 *     (`estFavorable`) : la médiane sépare « le marché vous a aidé » de « il
 *     vous a desservi », sans zone grise à expliquer.
 *
 * Le niveau conseillé reprend la règle des épisodes (`conseillerUnNiveau`) et
 * ses seuils (`SEUILS_DU_CONSEIL`) : le score de la partie est la part des
 * marchés où les décisions battent la référence.
 *
 * Tout est pur : les rejeux en entrée, le verdict et ses phrases en sortie.
 */
import { GRAINES_DU_BILAN, moyenne, quantile } from "@/engine/episodes/commun";
import { formatEuro, ordinal } from "@/lib/format";
import { SEUILS_DU_CONSEIL } from "@/pedagogy/profil/seuils-du-conseil";
import type { IssueDuRejeu } from "./rejeu";

/** Les trente marchés possibles : les graines du bilan des épisodes. */
export const GRAINES_DU_MERITE: readonly number[] = GRAINES_DU_BILAN;

/** Des décisions solides battent la référence sur au moins deux marchés sur trois. */
export const SEUIL_DES_DECISIONS_SOLIDES = 2 / 3;

/** Deux résultats plus proches qu'un centime sont égaux : les comptes sont au centime. */
const CENTIME = 0.005;

export type CasDuMerite = "merite" | "malchance" | "chance" | "lecon";

export const CAS_DU_MERITE: Record<CasDuMerite, { nom: string; aide: string }> = {
  merite: { nom: "Mérité", aide: "des décisions solides, et un résultat à leur hauteur" },
  malchance: {
    nom: "Malchance",
    aide: "des décisions solides, desservies par ce marché-ci : à refaire quand même",
  },
  chance: { nom: "Chance", aide: "des décisions fragiles, portées par ce marché-ci : à ne pas refaire" },
  lecon: { nom: "Leçon", aide: "des décisions fragiles, et ce marché-ci le montre" },
};

export function casDuMerite(solides: boolean, favorable: boolean): CasDuMerite {
  if (solides) return favorable ? "merite" : "malchance";
  return favorable ? "chance" : "lecon";
}

/** Des décisions qui battent la référence sur `battues` marchés sur `n` sont-elles solides ? */
export const sontSolides = (battues: number, n: number) =>
  n > 0 && battues / n >= SEUIL_DES_DECISIONS_SOLIDES - 1e-9;

/**
 * La place du marché joué parmi les `valeurs` que les mêmes décisions donnent
 * ailleurs : 1 quand aucun ne fait mieux. Comme `mesures.ts` des épisodes.
 */
export function placeDuTirage(valeurs: readonly number[], obtenu: number): number {
  return Math.min(valeurs.length, 1 + valeurs.filter((v) => v > obtenu + CENTIME).length);
}

/** Favorable : dans la meilleure moitié. */
export const estFavorable = (place: number, n: number) => place <= n / 2;

/* ---------------------------------------------------------------------------
 * LE NIVEAU CONSEILLÉ ET LA SUITE.
 * ------------------------------------------------------------------------- */

export type SensDuConseil = "monter" | "rester" | "descendre";

export interface SuiteConseillee {
  /** La part des marchés où les décisions battent la référence, de 0 à 1. */
  score: number;
  sens: SensDuConseil;
  niveau: number;
  /** Le code de l'entreprise à jouer ensuite (la tête de famille, comme /jouer la propose). */
  entreprise: string;
  /** La même entreprise que la partie jouée ? */
  memeEntreprise: boolean;
  pourquoi: string;
}

/**
 * LA SUITE : un cran à la fois.
 *
 *   · au-delà du seuil haut, on MONTE d'un niveau, sur la même entreprise : une
 *     seule nouveauté à la fois, les leviers que le niveau ouvre ;
 *   · entre les deux seuils, on RESTE au niveau, sur l'entreprise suivante :
 *     la méthode se confirme en changeant de métier ;
 *   · en deçà du seuil bas, on DESCEND d'un niveau, sur la même entreprise,
 *     pour reprendre pied là où l'on vient de jouer.
 * Au niveau le plus haut, on y reste et on change d'entreprise ; au premier, on
 * y reste et on rejoue la même.
 */
export function conseillerLaSuite(args: {
  score: number;
  niveau: number;
  niveauMax: number;
  entreprise: string;
  /** Les entreprises proposées, dans l'ordre de /jouer. */
  entreprises: readonly string[];
}): SuiteConseillee {
  const { score, niveau, niveauMax, entreprise, entreprises } = args;
  const suivante = (() => {
    const i = entreprises.indexOf(entreprise);
    return entreprises.length > 1 ? entreprises[(i + 1) % entreprises.length]! : entreprise;
  })();
  const pc = `${Math.round(score * 100)} %`;
  if (score >= SEUILS_DU_CONSEIL.expert) {
    if (niveau < niveauMax) {
      return {
        score,
        sens: "monter",
        niveau: niveau + 1,
        entreprise,
        memeEntreprise: true,
        pourquoi: `Vos décisions battent la référence sur ${pc} des marchés possibles. Passez au niveau ${niveau + 1}, sur la même entreprise : une seule nouveauté à la fois.`,
      };
    }
    return {
      score,
      sens: "rester",
      niveau,
      entreprise: suivante,
      memeEntreprise: suivante === entreprise,
      pourquoi: `Vos décisions battent la référence sur ${pc} des marchés possibles, au niveau le plus exigeant. Confirmez sur un autre métier.`,
    };
  }
  if (score <= SEUILS_DU_CONSEIL.decouverte) {
    return {
      score,
      sens: niveau > 1 ? "descendre" : "rester",
      niveau: Math.max(1, niveau - 1),
      entreprise,
      memeEntreprise: true,
      pourquoi:
        niveau > 1
          ? `Vos décisions ne battent la référence que sur ${pc} des marchés possibles. Rejouez cette entreprise au niveau ${niveau - 1}, avec moins de leviers, pour reprendre pied.`
          : `Vos décisions ne battent la référence que sur ${pc} des marchés possibles. Rejouez cette entreprise au même niveau, en partant de la gestion proposée et en ne changeant qu'un levier à la fois.`,
    };
  }
  return {
    score,
    sens: "rester",
    niveau,
    entreprise: suivante,
    memeEntreprise: suivante === entreprise,
    pourquoi: `Vos décisions battent la référence sur ${pc} des marchés possibles. Restez au niveau ${niveau} et changez de métier : le niveau suivant se propose à partir de ${Math.round(SEUILS_DU_CONSEIL.expert * 100)} %.`,
  };
}

/* ---------------------------------------------------------------------------
 * LE VERDICT.
 * ------------------------------------------------------------------------- */

export interface Repartition {
  min: number;
  max: number;
  /** La place la plus fréquente (la meilleure en cas d'égalité). */
  plusSouvent: number;
  /** Le nombre de marchés par place : `compte[0]` pour la 1re. */
  compte: number[];
}

function repartition(rangs: readonly number[], sur: number): Repartition {
  const compte = Array.from({ length: sur }, (_, i) => rangs.filter((r) => r === i + 1).length);
  const plusSouvent = compte.indexOf(Math.max(...compte)) + 1;
  return { min: Math.min(...rangs), max: Math.max(...rangs), plusSouvent, compte };
}

export interface MarcheRejoue {
  graine: number;
  resultat: number;
  ipg: number;
  rang: number;
  tresorerie: number;
  defaillant: boolean;
}

const marche = (r: IssueDuRejeu): MarcheRejoue => ({
  graine: r.graine,
  resultat: r.joueur.resultatNetCumule,
  ipg: r.joueur.ipg,
  rang: r.joueur.rang,
  tresorerie: r.joueur.tresorerieFinale,
  defaillant: r.joueur.defaillant,
});

export interface ConstatDeLaPartie {
  cle: "tour-le-plus-couteux" | "tour-le-plus-expose" | "part-du-hasard" | "faillites";
  texte: string;
}

export interface VerdictDuMerite {
  /** Le nombre de marchés possibles. */
  n: number;
  /** Le nombre d'entreprises en lice. */
  sur: number;
  cas: CasDuMerite;
  solides: boolean;
  favorable: boolean;
  /** Les marchés où les décisions du joueur battent la référence. */
  battues: number;
  joue: MarcheRejoue & { place: number };
  joueur: MarcheRejoue[];
  reference: MarcheRejoue[];
  rangs: Repartition;
  rangsDeLaReference: Repartition;
  moyennes: { joueur: number; reference: number };
  /** Ce que le marché joué a apporté (ou coûté) par rapport à la moyenne des mêmes décisions. */
  apportDuMarche: number;
  constats: ConstatDeLaPartie[];
  suite: SuiteConseillee;
  /** Les phrases du premier bloc. */
  phrases: { verdict: string; marche: string; rangs: string; reference: string };
}

const euros = (v: number) => formatEuro(Math.round(v) || 0);
const signe = (v: number) => (Math.round(v) > 0 ? `+${euros(v)}` : euros(v));
const place = (n: number) => ordinal(n);

export function verdictDuMerite(args: {
  /** La partie jouée, telle que le rejeu sous sa graine la retrouve. */
  joue: IssueDuRejeu;
  /** Les décisions du joueur sous chacun des marchés possibles. */
  joueur: readonly IssueDuRejeu[];
  /** La référence sous les mêmes marchés, dans le même ordre. */
  reference: readonly IssueDuRejeu[];
  /** Le libellé de chaque tour (« Trimestre 3 »), indice 0 pour le tour 1. */
  libelles: readonly string[];
  niveau: number;
  niveauMax: number;
  entreprise: string;
  entreprises: readonly string[];
}): VerdictDuMerite {
  const n = args.joueur.length;
  if (n === 0 || args.reference.length !== n) throw new Error("Rejeux incomplets");
  const joueur = args.joueur.map(marche);
  const reference = args.reference.map(marche);
  const sur = args.joue.sur;
  const battues = joueur.filter((j, i) => j.resultat > reference[i]!.resultat + CENTIME).length;
  const solides = sontSolides(battues, n);
  const obtenu = args.joue.joueur.resultatNetCumule;
  const placeDuJeu = placeDuTirage(
    joueur.map((j) => j.resultat),
    obtenu,
  );
  const favorable = estFavorable(placeDuJeu, n);
  const cas = casDuMerite(solides, favorable);
  const rangs = repartition(
    joueur.map((j) => j.rang),
    sur,
  );
  const rangsDeLaReference = repartition(
    reference.map((r) => r.rang),
    sur,
  );
  const moyennes = {
    joueur: moyenne(joueur.map((j) => j.resultat)),
    reference: moyenne(reference.map((r) => r.resultat)),
  };
  const apportDuMarche = obtenu - moyennes.joueur;

  // LES PHRASES DU PREMIER BLOC. Pas de jargon : des « marchés possibles ».
  const surN = `${battues} des ${n} marchés possibles`;
  const verdict = {
    merite: `Mérité. Vos décisions font mieux que la gestion de référence sur ${surN}, et votre résultat est à leur hauteur.`,
    malchance: `Malchance. Vos décisions font mieux que la gestion de référence sur ${surN}, mais ce marché-ci les a desservies. À refaire quand même.`,
    chance: `Chance. Votre résultat doit beaucoup au marché : vos décisions ne font mieux que la gestion de référence que sur ${battues === 0 ? `aucun des ${n} marchés possibles` : surN}, et celui-ci leur était favorable. À ne pas refaire tel quel.`,
    lecon: `Leçon. Vos décisions ne font mieux que la gestion de référence que sur ${battues === 0 ? `aucun des ${n} marchés possibles` : surN}, et ce marché-ci le montre.`,
  }[cas];
  const qualite =
    placeDuJeu <= n / 6
      ? "très favorable"
      : favorable
        ? "plutôt favorable"
        : placeDuJeu > (5 * n) / 6
          ? "très défavorable"
          : "plutôt défavorable";
  const marcheTexte =
    placeDuJeu === 1
      ? `Votre marché était le plus favorable des ${n} : ${qualite}.`
      : `Votre marché était le ${placeDuJeu}e plus favorable sur ${n} : ${qualite}.`;
  const rangsTexte =
    rangs.min === rangs.max
      ? `Sur ${n} marchés possibles, avec vos décisions : toujours ${place(rangs.min)} sur ${sur}.`
      : `Sur ${n} marchés possibles, avec vos décisions : entre la ${place(rangs.min)} et la ${place(rangs.max)} place sur ${sur}, la ${place(rangs.plusSouvent)} le plus souvent.`;
  const referenceTexte = `Sous les mêmes marchés, la gestion de référence fait ${euros(moyennes.reference)} de résultat cumulé en moyenne, vos décisions ${euros(moyennes.joueur)}. Elle finit ${place(rangsDeLaReference.plusSouvent)} le plus souvent.`;

  // CE QUE LA PARTIE MONTRE : des constats de tour, tirés des mêmes rejeux
  // (aucun calcul de plus). Isoler un levier demanderait un rejeu par levier.
  const constats: ConstatDeLaPartie[] = [];
  const tours = args.libelles.length;
  const ecarts = Array.from({ length: tours }, (_, t) =>
    moyenne(args.joueur.map((j, i) => j.resultatParTour[t]! - args.reference[i]!.resultatParTour[t]!)),
  );
  const pire = ecarts.indexOf(Math.min(...ecarts));
  if (tours > 0 && ecarts[pire]! < 0) {
    constats.push({
      cle: "tour-le-plus-couteux",
      texte: `Le tour le plus coûteux : ${args.libelles[pire]}. Face à la gestion de référence, vos décisions y perdent ${euros(-ecarts[pire]!)} de résultat en moyenne sur les ${n} marchés possibles.`,
    });
  } else if (tours > 0) {
    constats.push({
      cle: "tour-le-plus-couteux",
      texte: `Aucun tour ne vous coûte face à la gestion de référence : en moyenne sur les ${n} marchés possibles, vos décisions font au moins aussi bien à chaque tour.`,
    });
  }
  const etendues = Array.from({ length: tours }, (_, t) => {
    const v = args.joueur.map((j) => j.resultatParTour[t]!);
    return { bas: quantile(v, 0.1), haut: quantile(v, 0.9) };
  });
  const expose = etendues.reduce(
    (k, e, t) => (e.haut - e.bas > etendues[k]!.haut - etendues[k]!.bas ? t : k),
    0,
  );
  if (tours > 0) {
    const e = etendues[expose]!;
    constats.push({
      cle: "tour-le-plus-expose",
      texte: `Le tour le plus exposé au hasard : ${args.libelles[expose]}. Selon le marché, votre résultat de ce tour va de ${signe(e.bas)} à ${signe(e.haut)} dans huit cas sur dix.`,
    });
  }
  constats.push({
    cle: "part-du-hasard",
    texte:
      Math.abs(apportDuMarche) < 1
        ? `Ce marché-ci ne vous a ni aidé ni desservi : votre résultat est celui que vos décisions donnent en moyenne.`
        : `Ce marché-ci vous a ${apportDuMarche > 0 ? "apporté" : "coûté"} ${euros(Math.abs(apportDuMarche))} par rapport à la moyenne de vos décisions sur les ${n} marchés possibles. Cette part-là ne se refait pas.`,
  });
  const faillites = joueur.filter((j) => j.defaillant).length;
  if (faillites > 0) {
    constats.push({
      cle: "faillites",
      texte: `Sur ${faillites} des ${n} marchés possibles, vos décisions mènent à la cessation de paiements${
        reference.some((r) => r.defaillant) ? "" : ", ce que la gestion de référence évite partout"
      }.`,
    });
  }

  return {
    n,
    sur,
    cas,
    solides,
    favorable,
    battues,
    joue: { ...marche(args.joue), place: placeDuJeu },
    joueur,
    reference,
    rangs,
    rangsDeLaReference,
    moyennes,
    apportDuMarche,
    constats,
    suite: conseillerLaSuite({
      score: battues / n,
      niveau: args.niveau,
      niveauMax: args.niveauMax,
      entreprise: args.entreprise,
      entreprises: args.entreprises,
    }),
    phrases: { verdict, marche: marcheTexte, rangs: rangsTexte, reference: referenceTexte },
  };
}
