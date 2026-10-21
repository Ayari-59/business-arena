/**
 * MÉRITE OU CHANCE : ce que les décisions d'une partie solo valaient, tirage
 * mis à part.
 *
 * Le bilan de l'arène disait ce qui s'était passé. Une partie se joue pourtant
 * sous UN marché : un bon résultat ne prouve pas qu'on a bien décidé, un
 * mauvais ne prouve pas le contraire. Comme les épisodes manager
 * (`pedagogy/episodes/bilan.ts`), on rejoue donc les décisions du joueur,
 * telles quelles, sous trente marchés possibles (`rejeu.ts`), et la méthode de
 * référence, UN BON GESTIONNAIRE (`reference.ts`), sous les MÊMES trente
 * marchés : il a joué le marché du joueur avec ce que le joueur voyait, et ses
 * décisions sont rejouées de la même façon. Sous un même marché, la différence
 * entre les deux tient aux décisions.
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
 *     la majorité simple laisserait un pile ou face passer pour une méthode.
 *     Rien n'est exigé de l'écart moyen : c'est la décision du propriétaire,
 *     sur la mesure du lot « mérite durci ». Un seuil de 5 % écartait surtout
 *     des stratégies raisonnées qui battent la référence presque partout de
 *     peu ; l'exigence tient à la référence elle-même, un bon gestionnaire.
 *     L'écart moyen reste montré, et sert au niveau conseillé ;
 *   · le marché joué est FAVORABLE quand il place le résultat obtenu dans la
 *     meilleure moitié des trente résultats que les mêmes décisions donnent
 *     (`estFavorable`) : la médiane sépare « le marché vous a aidé » de « il
 *     vous a desservi », sans zone grise à expliquer.
 *
 * Le niveau conseillé suit le verdict : des décisions solides font monter
 * d'un niveau ; loin du bon gestionnaire (au plus 40 % des marchés battus ET
 * un écart moyen sous −25 %), on descend, sauf si le joueur gagne son marché
 * (`gagneSonMarche`) ; entre les deux, on reste et on change de métier
 * (`SEUILS_DE_LA_SUITE`). Les seuils des épisodes (0,8 et
 * 0,4 de la part des marchés battus) ne tenaient plus : face à une référence
 * compétente, la part battue est presque toujours proche de 0 ou de 1, et
 * presque tout le monde serait descendu.
 *
 * Tout est pur : les rejeux en entrée, le verdict et ses phrases en sortie.
 */
import { GRAINES_DU_BILAN, moyenne, quantile } from "@/engine/episodes/commun";
import { formatEuro, ordinal } from "@/lib/format";
import type { IssueDuRejeu } from "./rejeu";
import { NOM_DE_LA_REFERENCE, deLaReference, queLaReference } from "./reference";

/** Les trente marchés possibles : les graines du bilan des épisodes. */
export const GRAINES_DU_MERITE: readonly number[] = GRAINES_DU_BILAN;

/** Des décisions solides battent la référence sur au moins deux marchés sur trois. */
export const SEUIL_DES_DECISIONS_SOLIDES = 2 / 3;
/**
 * L'échelle d'un écart : le résultat moyen de la référence, et au moins 5 % de
 * son chiffre d'affaires moyen, pour qu'un résultat proche de zéro ne fasse pas
 * d'un écart de quelques euros un écart de 100 %.
 */
export const PLANCHER_DE_L_ECHELLE = 0.05;
export function echelleDeLaReference(resultatMoyen: number, chiffreDAffairesMoyen: number): number {
  return Math.max(1, Math.abs(resultatMoyen), PLANCHER_DE_L_ECHELLE * Math.abs(chiffreDAffairesMoyen));
}

/** La suite : on descend d'un niveau loin du bon gestionnaire, sur les deux critères à la fois. */
export const SEUILS_DE_LA_SUITE = { descente: { part: 0.4, ecart: -0.25 } } as const;

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
export const sontSolides = (battues: number, n: number) => n > 0 && battues / n >= SEUIL_DES_DECISIONS_SOLIDES - 1e-9;

/** « 12 % » : un écart relatif, sans signe, l'espace insécable avant le signe. */
const pourcent = (x: number) => `${Math.abs(Math.round(x * 100))}\u00a0%`;

/**
 * L'écart moyen dit après « sur 24 des 30 marchés possibles » : « de 12 % en
 * moyenne » quand il est favorable, entre parenthèses quand il ne l'est pas.
 * Des décisions peuvent battre la référence sur deux marchés sur trois et
 * perdre en moyenne, si les marchés perdus l'ont été de beaucoup.
 */
const enMoyenne = (ecart: number) =>
  Math.round(ecart * 100) >= 0
    ? `, de ${pourcent(ecart)} en moyenne`
    : ` (en moyenne, ${pourcent(ecart)} de résultat en moins)`;

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

/**
 * GAGNE-T-IL SON MARCHÉ ? Sur les marchés rejoués, ses décisions finissent le
 * plus souvent à la 1re place (la meilleure en cas d'égalité), ou à la 1re sur
 * au moins la moitié des marchés. Un joueur qui gagne son marché n'est jamais
 * renvoyé au niveau inférieur : décision du propriétaire. Il a battu les
 * concurrents que le niveau lui oppose ; qu'un bon gestionnaire fasse mieux
 * encore dit ce qui reste à apprendre, pas qu'il faille reculer.
 */
export function gagneSonMarche(rangs: Pick<Repartition, "plusSouvent" | "compte">, n: number): boolean {
  return n > 0 && (rangs.plusSouvent === 1 || (rangs.compte[0] ?? 0) >= n / 2);
}

export type SensDuConseil = "monter" | "rester" | "descendre";

export interface SuiteConseillee {
  /** La part des marchés où les décisions battent la référence, de 0 à 1. */
  score: number;
  /** L'écart moyen à la référence, en part de son échelle. */
  ecart: number;
  sens: SensDuConseil;
  niveau: number;
  /** Le code de l'entreprise à jouer ensuite (la tête de famille, comme /jouer la propose). */
  entreprise: string;
  /** Le joueur gagne-t-il son marché (`gagneSonMarche`) ? Alors on ne descend pas. */
  gagne: boolean;
  /** La même entreprise que la partie jouée ? */
  memeEntreprise: boolean;
  pourquoi: string;
}

/**
 * LA SUITE : un cran à la fois.
 *
 *   · des décisions SOLIDES font MONTER d'un niveau, sur la même entreprise :
 *     une seule nouveauté à la fois, les leviers que le niveau ouvre ;
 *   · loin du bon gestionnaire (peu de marchés battus ET un écart moyen
 *     nettement négatif), on DESCEND d'un niveau, sur la même entreprise, pour
 *     reprendre pied là où l'on vient de jouer ; JAMAIS quand le joueur gagne
 *     son marché (`gagneSonMarche`) : il reste au niveau, sur une autre
 *     entreprise ;
 *   · entre les deux, on RESTE au niveau, sur l'entreprise suivante : la
 *     méthode se confirme en changeant de métier.
 * Au niveau le plus haut, on y reste et on change d'entreprise ; au premier, on
 * y reste et on rejoue la même.
 */
export function conseillerLaSuite(args: {
  score: number;
  ecart: number;
  solides: boolean;
  /** `gagneSonMarche` : le joueur finit 1er le plus souvent sur les marchés rejoués. */
  gagne: boolean;
  niveau: number;
  niveauMax: number;
  entreprise: string;
  /** Les entreprises proposées, dans l'ordre de /jouer. */
  entreprises: readonly string[];
}): SuiteConseillee {
  const { score, ecart, solides, gagne, niveau, niveauMax, entreprise, entreprises } = args;
  const suivante = (() => {
    const i = entreprises.indexOf(entreprise);
    return entreprises.length > 1 ? entreprises[(i + 1) % entreprises.length]! : entreprise;
  })();
  const pc = `${Math.round(score * 100)}\u00a0%`;
  const base = { score, ecart, gagne };
  if (solides) {
    const constat = `Vos décisions font mieux ${queLaReference} sur ${pc} des marchés possibles${enMoyenne(ecart)}.`;
    if (niveau < niveauMax) {
      return {
        ...base,
        sens: "monter",
        niveau: niveau + 1,
        entreprise,
        memeEntreprise: true,
        pourquoi: `${constat} Passez au niveau ${niveau + 1}, sur la même entreprise : une seule nouveauté à la fois.`,
      };
    }
    return {
      ...base,
      sens: "rester",
      niveau,
      entreprise: suivante,
      memeEntreprise: suivante === entreprise,
      pourquoi: `${constat} Au niveau le plus exigeant, confirmez sur un autre métier.`,
    };
  }
  const { part, ecart: ecartBas } = SEUILS_DE_LA_SUITE.descente;
  if (!gagne && score <= part + 1e-9 && ecart < ecartBas) {
    const constat = `Vos décisions restent loin ${deLaReference} : ${pourcent(ecart)} de résultat en moins en moyenne sur les marchés possibles.`;
    return {
      ...base,
      sens: niveau > 1 ? "descendre" : "rester",
      niveau: Math.max(1, niveau - 1),
      entreprise,
      memeEntreprise: true,
      pourquoi:
        niveau > 1
          ? `${constat} Rejouez cette entreprise au niveau ${niveau - 1}, avec moins de leviers, pour reprendre pied.`
          : `${constat} Rejouez cette entreprise au même niveau : à chaque tour, lisez vos ventes manquées et votre stock avant de fixer le volume et le prix.`,
    };
  }
  return {
    ...base,
    sens: "rester",
    niveau,
    entreprise: suivante,
    memeEntreprise: suivante === entreprise,
    pourquoi: `${
      gagne && Math.round(ecart * 100) < 0
        ? `Vous gagnez votre marché ; ${NOM_DE_LA_REFERENCE} aurait fait mieux sur ces mêmes marchés (vous faites ${pourcent(ecart)} de résultat en moins en moyenne).`
        : ecart >= 0
        ? `Vos décisions font mieux ${queLaReference} sur ${pc} des marchés possibles seulement, trop peu souvent pour être solides (${pourcent(ecart)} de résultat en plus en moyenne).`
        : `Vos décisions approchent ${NOM_DE_LA_REFERENCE} sans l'égaler (${pourcent(ecart)} de résultat en moins en moyenne).`
    } ${
      gagne
        ? `Restez au niveau ${niveau} et essayez une autre entreprise : le niveau suivant se propose quand vos décisions sont solides.`
        : `Restez au niveau ${niveau} et changez de métier : le niveau suivant se propose quand vos décisions sont solides.`
    }`,
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
  /** La trésorerie nette la plus basse des tours (le creux). */
  tresorerieLaPlusBasse: number;
  /** Le chiffre d'affaires cumulé de la partie. */
  chiffreDAffaires: number;
  defaillant: boolean;
}

/** Un marché rejoué, lu de l'issue du rejeu (le verdict du bilan, et la copie d'examen). */
export const marcheRejoue = (r: IssueDuRejeu): MarcheRejoue => ({
  graine: r.graine,
  resultat: r.joueur.resultatNetCumule,
  ipg: r.joueur.ipg,
  rang: r.joueur.rang,
  tresorerie: r.joueur.tresorerieFinale,
  tresorerieLaPlusBasse: r.joueur.tresorerieLaPlusBasse,
  chiffreDAffaires: r.joueur.chiffreDAffairesCumule,
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
  /**
   * L'écart moyen du joueur à la référence, sous les mêmes marchés : en euros,
   * et rapporté à l'échelle de la référence (`echelleDeLaReference`).
   */
  ecart: { moyen: number; relatif: number };
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
  const joueur = args.joueur.map(marcheRejoue);
  const reference = args.reference.map(marcheRejoue);
  const sur = args.joue.sur;
  const battues = joueur.filter((j, i) => j.resultat > reference[i]!.resultat + CENTIME).length;
  const ecartMoyen = moyenne(joueur.map((j, i) => j.resultat - reference[i]!.resultat));
  const echelle = echelleDeLaReference(
    moyenne(reference.map((r) => r.resultat)),
    moyenne(args.reference.map((r) => r.joueur.chiffreDAffairesCumule)),
  );
  const ecart = { moyen: ecartMoyen, relatif: ecartMoyen / echelle };
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
  const surN = battues === 0 ? `aucun des ${n} marchés possibles` : `${battues} des ${n} marchés possibles`;
  // Il gagne son marché sans que ses décisions soient solides : la phrase le
  // dit d'abord, pour que le verdict ne contredise ni le classement, ni le
  // conseil de la suite (qui ne le fait jamais redescendre).
  const gagne = gagneSonMarche(rangs, n);
  const sansReference =
    battues === 0
      ? `vos décisions ne font mieux ${queLaReference} sur aucun des ${n} marchés possibles`
      : `vos décisions ne font mieux ${queLaReference} que sur ${surN}`;
  const fragiles = gagne
    ? `vous gagnez votre marché (1re place sur ${rangs.compte[0] ?? 0} des ${n}), mais ${sansReference}`
    : sansReference;
  const verdict = {
    merite: `Mérité. Vos décisions font mieux ${queLaReference} sur ${surN}${enMoyenne(ecart.relatif)}, et votre résultat est à leur hauteur.`,
    malchance: `Malchance. Vos décisions font mieux ${queLaReference} sur ${surN}${enMoyenne(ecart.relatif)}, mais ce marché-ci les a desservies. À refaire quand même.`,
    chance: `Chance. Votre résultat doit beaucoup au marché : ${fragiles}, et celui-ci leur était favorable. À ne pas refaire tel quel.`,
    lecon: `Leçon. ${fragiles.charAt(0).toUpperCase()}${fragiles.slice(1)}, et ce marché-ci le montre.`,
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
  const referenceTexte = `Sous les mêmes marchés, ${NOM_DE_LA_REFERENCE} fait ${euros(moyennes.reference)} de résultat cumulé en moyenne, vos décisions ${euros(moyennes.joueur)}. Il finit le plus souvent à la ${place(rangsDeLaReference.plusSouvent)} place.`;

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
      texte: `Le tour le plus coûteux : ${args.libelles[pire]}. Face à ${NOM_DE_LA_REFERENCE}, vos décisions y perdent ${euros(-ecarts[pire]!)} de résultat en moyenne sur les ${n} marchés possibles.`,
    });
  } else if (tours > 0) {
    constats.push({
      cle: "tour-le-plus-couteux",
      texte: `Aucun tour ne vous coûte face à ${NOM_DE_LA_REFERENCE} : en moyenne sur les ${n} marchés possibles, vos décisions font au moins aussi bien à chaque tour.`,
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
        reference.some((r) => r.defaillant) ? "" : `, ce ${queLaReference} évite partout`
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
    ecart,
    joue: { ...marcheRejoue(args.joue), place: placeDuJeu },
    joueur,
    reference,
    rangs,
    rangsDeLaReference,
    moyennes,
    apportDuMarche,
    constats,
    suite: conseillerLaSuite({
      score: battues / n,
      ecart: ecart.relatif,
      solides,
      gagne,
      niveau: args.niveau,
      niveauMax: args.niveauMax,
      entreprise: args.entreprise,
      entreprises: args.entreprises,
    }),
    phrases: { verdict, marche: marcheTexte, rangs: rangsTexte, reference: referenceTexte },
  };
}
