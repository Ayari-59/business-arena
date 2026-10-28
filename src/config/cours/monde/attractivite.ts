import type {
  CodeDEnseigne,
  CodeDeGamme,
  CodeDeStrategie,
  EnseigneDuMarche,
  FicheDuMarche,
  GammeDeNova,
  Offre,
  PointDeCourbe,
  StrategieDeNova,
  Trimestre,
} from "./marche-a-trois";

/**
 * LE MODÈLE DU MARCHÉ À TROIS : NOVA, SoundBox et Auris se partagent un marché, trimestre par
 * trimestre (les chapitres de stratégie « domination par les coûts ou différenciation », « lire la
 * stratégie de ses concurrents » et « la responsabilité sociétale »).
 *
 * Tout se calcule sur la fiche (monde/marche-a-trois.ts), en fonctions pures : la même fiche et les
 * mêmes leviers donnent toujours les mêmes chiffres. Chaque fonction qu'un curseur ou un laboratoire
 * lira prend ses leviers en paramètres (le prix, la gamme, les budgets de NOVA, ses budgets RSE de
 * chaque trimestre, les offres des concurrents), avec la fiche pour valeur de départ.
 *
 *   1. L'ATTRACTIVITÉ ET LA PART DE MARCHÉ : la qualité perçue (la gamme et la courbe du budget
 *      qualité), l'image (la communication et le capital-image), l'attractivité = (prix de référence
 *      ÷ prix) puissance e × qualité puissance a × (1 + image) × (1 + bonus du label) ; la part de
 *      marché = l'attractivité ÷ la somme des trois.
 *   2. L'ANNÉE DU MARCHÉ : chaque trimestre, la demande de chaque enseigne (sa part du marché, à
 *      l'enceinte), ses ventes (dans la limite de sa capacité) ; sur l'année, le chiffre d'affaires,
 *      la marge sur coût variable, la marge par enceinte, les charges (fixes et budgets), le coût
 *      complet d'une enceinte vendue, le résultat, le seuil de rentabilité.
 *   3. LES STRATÉGIES GÉNÉRIQUES : le milieu, la domination par les coûts et la différenciation de
 *      NOVA, leur classement ; la demi-mesure (les prix bas sans rien couper) ; les ventes qu'il
 *      faudrait pour égaler un résultat ; battre Auris en résultat.
 *   4. LA CARTE PERCEPTUELLE ET L'ESPACE LIBRE : le prix moyen et la qualité moyenne du marché, les
 *      indices, la lecture de la stratégie de chaque enseigne ; l'espace libre (le milieu des deux
 *      enseignes voisines les plus éloignées sur la carte, sur les deux indices), son prix et sa
 *      qualité, la gamme qu'il faut pour l'atteindre ; aller dans l'espace libre, par le seul prix
 *      ou avec la qualité.
 *   5. LE CAPITAL-IMAGE ET LE LABEL : l'effort d'un budget RSE, le capital trimestre par trimestre,
 *      le poids d'un trimestre dans le capital (dépenser tard compte plus), le capital à budget
 *      constant et son plafond, le budget sous lequel le label ne vient jamais, le budget constant
 *      qui l'obtient en n trimestres, le plan le moins cher qui l'obtient, les trimestres du label.
 *   6. L'ENGAGEMENT RSE DANS L'ANNÉE : l'année jouée avec des budgets RSE, face à l'année sans
 *      engagement ; viser le label avec un budget constant, face au budget du cours.
 *
 * CONVENTIONS : les montants sont au centime ; les attractivités, les parts, les qualités et les
 * capitaux ne sont pas arrondis (c'est l'affichage qui arrondit). Une demande s'arrondit à
 * l'enceinte la plus proche chaque trimestre ; les ventes sont la demande, dans la limite de la
 * capacité. Les indices de la carte s'arrondissent à l'unité, sur un prix moyen au centime et une
 * qualité moyenne au centième (comme l'élève les écrit). Un écart négatif est une perte.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
/** Une qualité, une image ou un capital, débarrassé du bruit des virgules flottantes. */
const net = (x: number) => Math.round(x * 1e9) / 1e9 + 0;

const TRIMESTRES: readonly Trimestre[] = [1, 2, 3, 4];

// ═════════════════════════════════════════════════════════════════════════════
// 0. LES DONNÉES DE BASE
// ═════════════════════════════════════════════════════════════════════════════

/** Une courbe de la fiche lue à un budget : une droite entre deux points, le premier point en dessous, le dernier au-delà. */
export function interpoler(points: readonly PointDeCourbe[], budget: number): number {
  const b = Math.max(0, budget);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const z = points[i]!;
    if (b <= z.budget) return net(a.effet + ((z.effet - a.effet) * (b - a.budget)) / (z.budget - a.budget));
  }
  return points.at(-1)!.effet;
}

export const enseigneDe = (f: FicheDuMarche, code: CodeDEnseigne): EnseigneDuMarche => {
  const e = f.enseignes.find((x) => x.code === code);
  if (!e) throw new Error(`Pas d'enseigne ${code}`);
  return e;
};

export const gammeDe = (f: FicheDuMarche, code: CodeDeGamme): GammeDeNova => {
  const g = f.gammes.find((x) => x.code === code);
  if (!g) throw new Error(`Pas de gamme ${code}`);
  return g;
};

export const strategieDe = (f: FicheDuMarche, code: CodeDeStrategie): StrategieDeNova => {
  const s = f.strategies.find((x) => x.code === code);
  if (!s) throw new Error(`Pas de stratégie ${code}`);
  return s;
};

/** Le coût variable d'une enceinte : composants + autres coûts variables. */
export const coutVariable = (o: Offre) => auCentime(o.composants + o.autres);

/** La marge sur coût variable d'une enceinte : prix − coût variable. */
export const margeUnitaire = (o: Offre) => auCentime(o.prix - coutVariable(o));

/** Les leviers de NOVA : son prix, sa gamme et ses budgets par trimestre. Chacun a sa valeur de départ dans la fiche. */
export interface LeviersDeNova {
  prix: number;
  gamme: CodeDeGamme;
  budgetQualite: number;
  budgetCommunication: number;
}

/** L'offre de NOVA à ces leviers : la gamme donne les coûts variables et la qualité de conception. */
export function offreDeNova(f: FicheDuMarche, leviers: Partial<LeviersDeNova> = {}): Offre {
  const nova = enseigneDe(f, "nova").offre;
  const g = leviers.gamme ? gammeDe(f, leviers.gamme) : null;
  return {
    ...nova,
    prix: leviers.prix ?? nova.prix,
    ...(g ? { composants: g.composants, autres: g.autres, qualiteDeConception: g.qualiteDeConception } : {}),
    budgetQualite: leviers.budgetQualite ?? nova.budgetQualite,
    budgetCommunication: leviers.budgetCommunication ?? nova.budgetCommunication,
  };
}

/** Les leviers d'une stratégie de la fiche. */
export const leviersDe = (f: FicheDuMarche, code: CodeDeStrategie): LeviersDeNova => {
  const s = strategieDe(f, code);
  return { prix: s.prix, gamme: s.gamme, budgetQualite: s.budgetQualite, budgetCommunication: s.budgetCommunication };
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. L'ATTRACTIVITÉ ET LA PART DE MARCHÉ
// ═════════════════════════════════════════════════════════════════════════════

/** La qualité perçue d'une offre : sa qualité de conception + ce que son budget qualité y ajoute (la courbe). */
export const qualitePercue = (f: FicheDuMarche, o: Offre) => net(o.qualiteDeConception + interpoler(f.courbeDuBudgetQualite, o.budgetQualite));

/** Ce que la communication d'un trimestre ajoute à l'image (la courbe). */
export const effetDeLaCommunication = (f: FicheDuMarche, budget: number) => interpoler(f.courbeDeLaCommunication, budget);

/** L'image d'une offre dans un trimestre : la communication du trimestre + sensibilité × capital-image d'ouverture. */
export const image = (f: FicheDuMarche, o: Offre, capital: number) => effetDeLaCommunication(f, o.budgetCommunication) + f.rse.sensibilite * capital;

/**
 * L'attractivité d'une offre dans un trimestre : (prix de référence ÷ prix) puissance e × qualité
 * perçue puissance a × (1 + image) × (1 + bonus du label, s'il est accordé ce trimestre).
 */
export function attractivite(f: FicheDuMarche, o: Offre, contexte: Partial<{ capital: number; label: boolean }> = {}) {
  const a = f.attractivite;
  const prix = Math.pow(a.prixDeReference / o.prix, a.elasticiteAuPrix);
  const qualite = Math.pow(qualitePercue(f, o), a.elasticiteALaQualite);
  return prix * qualite * (1 + image(f, o, contexte.capital ?? 0)) * (contexte.label ? 1 + f.rse.bonusDuLabel : 1);
}

/** Les parts de marché : chaque attractivité ÷ la somme des attractivités. */
export function partsDeMarche(attractivites: readonly number[]) {
  const total = somme(attractivites);
  return attractivites.map((a) => a / total);
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. L'ANNÉE DU MARCHÉ
// ═════════════════════════════════════════════════════════════════════════════

/** Les leviers d'une année. Chacun a sa valeur de départ dans la fiche. */
export interface LeviersDuMarche {
  /** Les leviers de NOVA, tenus les quatre trimestres. */
  nova: Partial<LeviersDeNova>;
  /** Les budgets RSE de NOVA, trimestre par trimestre (par défaut, aucun). */
  rse: readonly number[];
  /** Ce qui change aux offres des concurrents. */
  concurrents: Partial<Record<Exclude<CodeDEnseigne, "nova">, Partial<Offre>>>;
  /** Le marché d'un trimestre. */
  marcheParTrimestre: number;
}

export interface TrimestreDUneEnseigne {
  trimestre: Trimestre;
  budgetRse: number;
  /** Le capital-image d'ouverture (celui de la fin du trimestre d'avant), qui joue ce trimestre. */
  capitalDOuverture: number;
  label: boolean;
  attractivite: number;
  part: number;
  demande: number;
  ventes: number;
  refusees: number;
}

/**
 * Une année du marché, trimestre par trimestre puis en grandes masses, pour chaque enseigne. Chaque
 * trimestre : le capital d'ouverture et le label de chacune, son attractivité, sa part, sa demande
 * (la part du marché du trimestre, à l'enceinte), ses ventes (dans la limite de sa capacité). Sur
 * l'année : le chiffre d'affaires, la marge sur coût variable, les charges (fixes + budgets qualité,
 * communication et RSE), le coût complet d'une enceinte vendue (coûts variables et charges, divisés
 * par les ventes), le résultat (marge − charges), le seuil de rentabilité (charges ÷ marge par
 * enceinte, à l'enceinte supérieure).
 */
export function anneeDuMarche(f: FicheDuMarche, leviers: Partial<LeviersDuMarche> = {}) {
  const marcheParTrimestre = leviers.marcheParTrimestre ?? f.marche.parTrimestre;
  const offres = f.enseignes.map((e) =>
    e.code === "nova" ? offreDeNova(f, leviers.nova) : { ...e.offre, ...(leviers.concurrents?.[e.code as Exclude<CodeDEnseigne, "nova">] ?? {}) },
  );
  const rseDeNova = TRIMESTRES.map((_, i) => leviers.rse?.[i] ?? offres[0]!.budgetRse);
  const budgetsRse = f.enseignes.map((e, k) => (e.code === "nova" ? rseDeNova : TRIMESTRES.map(() => offres[k]!.budgetRse)));
  const capitaux = f.enseignes.map((e, k) => capitalImage(f, budgetsRse[k]!, e.capitalImage));
  const labels = capitaux.map((c) => labelsDeLAnnee(f, c.ouvertures));
  const trimestres = TRIMESTRES.map((t, i) => {
    const attractivites = offres.map((o, k) => attractivite(f, o, { capital: capitaux[k]!.ouvertures[i]!, label: labels[k]!.actifs[i]! }));
    const parts = partsDeMarche(attractivites);
    return f.enseignes.map((e, k): TrimestreDUneEnseigne => {
      const demande = Math.round(parts[k]! * marcheParTrimestre);
      const ventes = Math.min(demande, e.capacite);
      return {
        trimestre: t,
        budgetRse: budgetsRse[k]![i]!,
        capitalDOuverture: capitaux[k]!.ouvertures[i]!,
        label: labels[k]!.actifs[i]!,
        attractivite: attractivites[k]!,
        part: parts[k]!,
        demande,
        ventes,
        refusees: demande - ventes,
      };
    });
  });
  const marche = marcheParTrimestre * TRIMESTRES.length;
  const enseignes = f.enseignes.map((e, k) => {
    const o = offres[k]!;
    const parTrimestre = trimestres.map((x) => x[k]!);
    const ventes = somme(parTrimestre.map((x) => x.ventes));
    const demande = somme(parTrimestre.map((x) => x.demande));
    const cv = coutVariable(o);
    const mu = margeUnitaire(o);
    const chiffreDAffaires = auCentime(ventes * o.prix);
    const coutsVariables = auCentime(ventes * cv);
    const marge = auCentime(ventes * mu);
    const budgetQualite = auCentime(o.budgetQualite * TRIMESTRES.length);
    const budgetCommunication = auCentime(o.budgetCommunication * TRIMESTRES.length);
    const budgetRse = auCentime(somme(budgetsRse[k]!));
    const charges = auCentime(e.chargesFixes + budgetQualite + budgetCommunication + budgetRse);
    const resultat = auCentime(marge - charges);
    return {
      code: e.code,
      nom: e.nom,
      offre: o,
      qualite: qualitePercue(f, o),
      /** L'image de la communication seule, sans le capital-image. */
      imageDeLaCommunication: effetDeLaCommunication(f, o.budgetCommunication),
      capital: capitaux[k]!,
      labels: labels[k]!,
      trimestres: parTrimestre,
      demande,
      ventes,
      refusees: demande - ventes,
      part: ventes / marche,
      coutVariable: cv,
      margeUnitaire: mu,
      chiffreDAffaires,
      coutsVariables,
      marge,
      tauxDeMarge: marge / chiffreDAffaires,
      chargesFixes: e.chargesFixes,
      budgetQualite,
      budgetCommunication,
      budgetRse,
      budgets: auCentime(budgetQualite + budgetCommunication + budgetRse),
      charges,
      coutComplet: auCentime((coutsVariables + charges) / ventes),
      resultat,
      seuilDeRentabilite: Math.ceil(charges / mu - 1e-9),
    };
  });
  return {
    marche,
    marcheParTrimestre,
    trimestres,
    enseignes,
    nova: enseignes[0]!,
    soundbox: enseignes.find((x) => x.code === "soundbox")!,
    auris: enseignes.find((x) => x.code === "auris")!,
  };
}

export type AnneeDuMarche = ReturnType<typeof anneeDuMarche>;
export type BilanDUneEnseigne = AnneeDuMarche["enseignes"][number];

/** Le meilleur prix de NOVA pour une offre, au pas donné entre deux bornes, les autres leviers tenus : le prix et le résultat. */
export function meilleurPrix(f: FicheDuMarche, leviers: Partial<Omit<LeviersDuMarche, "nova">> & { nova?: Partial<Omit<LeviersDeNova, "prix">> } = {}, bornes = { min: 40, max: 100, pas: 0.5 }) {
  let meilleur = { prix: bornes.min, resultat: -Infinity };
  for (let k = 0; bornes.min + k * bornes.pas <= bornes.max + 1e-9; k++) {
    const prix = auCentime(bornes.min + k * bornes.pas);
    const r = anneeDuMarche(f, { ...leviers, nova: { ...leviers.nova, prix } }).nova.resultat;
    if (r > meilleur.resultat) meilleur = { prix, resultat: r };
  }
  return meilleur;
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LES STRATÉGIES GÉNÉRIQUES
// ═════════════════════════════════════════════════════════════════════════════

/** L'année jouée avec une stratégie de la fiche (les concurrents et le marché peuvent changer). */
export const anneeAvec = (f: FicheDuMarche, code: CodeDeStrategie, leviers: Partial<Omit<LeviersDuMarche, "nova">> = {}) =>
  anneeDuMarche(f, { ...leviers, nova: leviersDe(f, code) });

/** Les ventes qu'il faudrait à une enseigne, à sa marge par enceinte et à ses charges, pour atteindre un résultat : (résultat + charges) ÷ marge, à l'enceinte supérieure. */
export const ventesPourAtteindre = (bilan: Pick<BilanDUneEnseigne, "charges" | "margeUnitaire">, resultat: number) =>
  Math.ceil((resultat + bilan.charges) / bilan.margeUnitaire - 1e-9);

export type RangDuMilieu = "premier" | "entre" | "dernier";

/**
 * Les trois stratégies génériques de NOVA, chacune tenue toute l'année : le milieu (NOVA
 * aujourd'hui), la domination par les coûts, la différenciation. Le classement par le résultat, le
 * rang du milieu, et l'enlisement : le milieu n'a ni la part de marché de la stratégie de coûts ni
 * la marge par enceinte de la différenciation.
 */
export function strategiesGeneriques(f: FicheDuMarche, leviers: Partial<Omit<LeviersDuMarche, "nova">> = {}) {
  const annees = { milieu: anneeAvec(f, "milieu", leviers), couts: anneeAvec(f, "couts", leviers), differenciation: anneeAvec(f, "differenciation", leviers) };
  const milieu = annees.milieu.nova;
  const couts = annees.couts.nova;
  const differenciation = annees.differenciation.nova;
  const trois = [
    { code: "couts" as const, bilan: couts },
    { code: "milieu" as const, bilan: milieu },
    { code: "differenciation" as const, bilan: differenciation },
  ];
  const parResultat = [...trois].sort((a, b) => b.bilan.resultat - a.bilan.resultat);
  const meilleure = parResultat[0]!;
  const pire = parResultat.at(-1)!;
  const rangDuMilieu: RangDuMilieu = meilleure.code === "milieu" ? "premier" : pire.code === "milieu" ? "dernier" : "entre";
  return {
    annees,
    milieu,
    couts,
    differenciation,
    trois,
    meilleure,
    pire,
    rangDuMilieu,
    coince: milieu.part < couts.part && milieu.margeUnitaire < differenciation.margeUnitaire,
    ecartCouts: auCentime(couts.resultat - milieu.resultat),
    ecartDifferenciation: auCentime(differenciation.resultat - milieu.resultat),
    /** Les ventes qu'il faudrait à la stratégie de coûts pour égaler le résultat de la différenciation. */
    ventesDesCoutsPourEgalerLaDifferenciation: ventesPourAtteindre(couts, differenciation.resultat),
  };
}

export type VerdictDeLaDemiMesure = "demi-mesure" | "couts" | "milieu";

/**
 * La demi-mesure : le prix de la stratégie de coûts, sans rien couper (ni la gamme, ni le budget
 * qualité). Face à la stratégie de coûts entière et au milieu : la part, la marge par enceinte, les
 * coûts gardés, le résultat, et la meilleure des trois.
 */
export function demiMesure(f: FicheDuMarche, leviers: Partial<Omit<LeviersDuMarche, "nova">> = {}) {
  const demi = anneeAvec(f, "demi-mesure", leviers).nova;
  const couts = anneeAvec(f, "couts", leviers).nova;
  const milieu = anneeAvec(f, "milieu", leviers).nova;
  const trois = [
    { code: "milieu" as const, bilan: milieu },
    { code: "couts" as const, bilan: couts },
    { code: "demi-mesure" as const, bilan: demi },
  ];
  const verdict: VerdictDeLaDemiMesure = [...trois].sort((a, b) => b.bilan.resultat - a.bilan.resultat)[0]!.code;
  return {
    demi,
    couts,
    milieu,
    trois,
    verdict,
    ecartAvecLesCouts: auCentime(demi.resultat - couts.resultat),
    ecartAvecLeMilieu: auCentime(demi.resultat - milieu.resultat),
    /** Ce que la demi-mesure garde de plus que la stratégie de coûts : les coûts variables de l'année au coût d'aujourd'hui, et le budget qualité. */
    coutVariableEnPlus: auCentime(demi.coutVariable - couts.coutVariable),
    budgetsEnPlus: auCentime(demi.budgets - couts.budgets),
  };
}

/**
 * Battre Auris en résultat : l'année jouée avec les leviers de NOVA, le résultat de NOVA face à
 * celui d'Auris dans la même année (Auris vend plus ou moins selon ce que fait NOVA).
 */
export function battreAuris(f: FicheDuMarche, leviers: Partial<LeviersDuMarche> = {}) {
  const a = anneeDuMarche(f, leviers);
  const ecart = auCentime(a.nova.resultat - a.auris.resultat);
  return { nova: a.nova, auris: a.auris, ecart, battue: ecart > 0 };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LA CARTE PERCEPTUELLE ET L'ESPACE LIBRE
// ═════════════════════════════════════════════════════════════════════════════

export type StrategieLue = "couts" | "differenciation" | "intermediaire";

/** La lecture d'une position, selon la règle du cours : sous 100 − écart en prix et sous 100 en qualité, les coûts ; au-dessus de 100 + écart et de 100, la différenciation. */
export function lirePosition(f: FicheDuMarche, indicePrix: number, indiceQualite: number): StrategieLue {
  const e = f.carte.ecartDUneStrategie;
  if (indicePrix < 100 - e && indiceQualite < 100) return "couts";
  if (indicePrix > 100 + e && indiceQualite > 100) return "differenciation";
  return "intermediaire";
}

/**
 * La carte du marché d'une année : le prix moyen du marché (le chiffre d'affaires des trois
 * enseignes ÷ leurs ventes, au centime), la qualité moyenne (la moyenne des trois qualités perçues,
 * au centième), et pour chaque enseigne ses deux indices (prix ÷ prix moyen × 100, qualité ÷ qualité
 * moyenne × 100, à l'unité) et sa lecture.
 *
 * L'ESPACE LIBRE, selon la règle du cours : les enseignes rangées par indice de prix, la distance
 * entre deux voisines se mesure sur les deux indices (√(écart de prix² + écart de qualité²)) ; la
 * place libre est le milieu des deux voisines les plus éloignées : son prix est la moyenne de leurs
 * prix (au centime), sa qualité la moyenne de leurs qualités (au centième). Le plus grand écart de
 * prix seul (l'ancienne lecture) est rendu à côté, pour comparer.
 */
export function carteDuMarche(f: FicheDuMarche, leviers: Partial<LeviersDuMarche> = {}) {
  const a = anneeDuMarche(f, leviers);
  const chiffreDAffaires = auCentime(somme(a.enseignes.map((e) => e.chiffreDAffaires)));
  const ventes = somme(a.enseignes.map((e) => e.ventes));
  const prixMoyen = auCentime(chiffreDAffaires / ventes);
  const sommeDesQualites = net(somme(a.enseignes.map((e) => e.qualite)));
  const qualiteMoyenne = auCentieme(sommeDesQualites / a.enseignes.length);
  const enseignes = a.enseignes.map((e) => {
    const indicePrix = Math.round((e.offre.prix / prixMoyen) * 100);
    const indiceQualite = Math.round((e.qualite / qualiteMoyenne) * 100);
    return { code: e.code, nom: e.nom, prix: e.offre.prix, qualite: e.qualite, part: e.part, resultat: e.resultat, indicePrix, indiceQualite, lecture: lirePosition(f, indicePrix, indiceQualite) };
  });
  const rangees = [...enseignes].sort((x, y) => x.indicePrix - y.indicePrix);
  const voisines = rangees.slice(1).map((haut, k) => {
    const bas = rangees[k]!;
    const ecartDePrix = haut.indicePrix - bas.indicePrix;
    const ecartDeQualite = haut.indiceQualite - bas.indiceQualite;
    return { bas, haut, ecartDePrix, ecartDeQualite, distance: Math.hypot(ecartDePrix, ecartDeQualite) };
  });
  const plusEloignees = voisines.reduce((g, x) => (x.distance > g.distance ? x : g), voisines[0]!);
  const plusGrandEcartDePrix = voisines.reduce((g, x) => (x.ecartDePrix > g.ecartDePrix ? x : g), voisines[0]!);
  const espaceLibre = {
    entre: plusEloignees,
    prix: auCentime((plusEloignees.bas.prix + plusEloignees.haut.prix) / 2),
    qualite: auCentieme((plusEloignees.bas.qualite + plusEloignees.haut.qualite) / 2),
    indicePrix: (plusEloignees.bas.indicePrix + plusEloignees.haut.indicePrix) / 2,
    indiceQualite: (plusEloignees.bas.indiceQualite + plusEloignees.haut.indiceQualite) / 2,
  };
  const meilleure = [...enseignes].sort((x, y) => y.resultat - x.resultat)[0]!;
  return { annee: a, chiffreDAffaires, ventes, prixMoyen, sommeDesQualites, qualiteMoyenne, enseignes, nova: enseignes[0]!, voisines, espaceLibre, plusGrandEcartDePrix, meilleure };
}

/** La gamme la moins chère qui porte NOVA, à son budget qualité, au moins à une qualité perçue ; null si aucune n'y suffit. */
export function gammePourLaQualite(f: FicheDuMarche, qualite: number, budgetQualite: number = enseigneDe(f, "nova").offre.budgetQualite): CodeDeGamme | null {
  const parCout = [...f.gammes].sort((a, b) => a.composants + a.autres - (b.composants + b.autres));
  const g = parCout.find((x) => net(x.qualiteDeConception + interpoler(f.courbeDuBudgetQualite, budgetQualite)) >= qualite - 1e-9);
  return g ? g.code : null;
}

export type VerdictDeLEspaceLibre = "y-aller-avec-la-qualite" | "rester";

/**
 * Aller dans l'espace libre : NOVA au prix de la place, tenu toute l'année. Par le seul prix (la
 * gamme et les budgets d'aujourd'hui : l'ancienne lecture de la carte), ou avec la gamme qui l'amène
 * à la qualité de la place (les budgets d'aujourd'hui). Chacune face à NOVA aujourd'hui.
 */
export function allerDansLEspaceLibre(f: FicheDuMarche) {
  const carte = carteDuMarche(f);
  const place = carte.espaceLibre;
  const aujourdhui = carte.annee.nova;
  const gamme = gammePourLaQualite(f, place.qualite);
  const prixSeul = anneeDuMarche(f, { nova: { prix: place.prix } });
  const avecLaQualite = gamme ? anneeDuMarche(f, { nova: { prix: place.prix, gamme } }) : null;
  const ecartPrixSeul = auCentime(prixSeul.nova.resultat - aujourdhui.resultat);
  const ecartAvecLaQualite = avecLaQualite ? auCentime(avecLaQualite.nova.resultat - aujourdhui.resultat) : null;
  const verdict: VerdictDeLEspaceLibre = ecartAvecLaQualite !== null && ecartAvecLaQualite > 0 ? "y-aller-avec-la-qualite" : "rester";
  return {
    carte,
    place,
    aujourdhui,
    gamme,
    prixSeul: prixSeul.nova,
    avecLaQualite: avecLaQualite?.nova ?? null,
    variationDuPrix: place.prix / aujourdhui.offre.prix - 1,
    indiceDePrixDeLaPlace: Math.round((place.prix / carte.prixMoyen) * 100),
    ecartPrixSeul,
    ecartAvecLaQualite,
    verdict,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LE CAPITAL-IMAGE ET LE LABEL
// ═════════════════════════════════════════════════════════════════════════════

/** L'effort d'un budget RSE d'un trimestre : ln(1 + budget ÷ échelle). */
export const effortRse = (f: FicheDuMarche, budget: number) => Math.log(1 + Math.max(0, budget) / f.rse.echelle);

/**
 * Le capital-image trimestre par trimestre : capital de fin = inertie × capital d'avant + (1 −
 * inertie) × effort du trimestre. `fins[i]` est le capital à la fin du trimestre i + 1 ;
 * `ouvertures[i]`, celui qui joue au trimestre i + 1 (la fin du trimestre d'avant, le départ au
 * premier).
 */
export function capitalImage(f: FicheDuMarche, budgets: readonly number[], depart = 0) {
  const k = f.rse.inertie;
  const efforts = budgets.map((b) => effortRse(f, b));
  const fins: number[] = [];
  let c = depart;
  for (const e of efforts) {
    c = k * c + (1 - k) * e;
    fins.push(c);
  }
  return { budgets, efforts, fins, ouvertures: [depart, ...fins.slice(0, -1)], apres: fins.at(-1) ?? depart };
}

/**
 * Le poids de l'effort de chaque trimestre dans le capital de la fin du trimestre n (parti de
 * zéro) : (1 − inertie) × inertie puissance (n − t). Le dernier trimestre pèse le plus : dépenser
 * tard compte plus.
 */
export const poidsDesTrimestres = (f: FicheDuMarche, n = 3) =>
  Array.from({ length: n }, (_, i) => (1 - f.rse.inertie) * Math.pow(f.rse.inertie, n - 1 - i));

/** Le capital après n trimestres au même budget, parti de zéro : effort × (1 − inertie puissance n). */
export const capitalABudgetConstant = (f: FicheDuMarche, budget: number, n: number) => effortRse(f, budget) * (1 - Math.pow(f.rse.inertie, n));

/** Le budget par trimestre sous lequel le label ne vient jamais : son effort, le plafond du capital, n'atteint pas le seuil. Échelle × (e puissance seuil − 1). */
export const budgetPlancherDuLabel = (f: FicheDuMarche) => auCentime(f.rse.echelle * (Math.exp(f.rse.seuilDuLabel) - 1));

/** Le budget constant qui porte le capital au seuil en n trimestres : échelle × (e puissance (seuil ÷ (1 − inertie puissance n)) − 1). */
export const budgetConstantDuLabel = (f: FicheDuMarche, n = 3) => auCentime(f.rse.echelle * (Math.exp(f.rse.seuilDuLabel / (1 - Math.pow(f.rse.inertie, n))) - 1));

/** Les trimestres d'engagement constant qu'il faut pour que le capital atteigne le seuil, parti de zéro ; null s'il ne l'atteint jamais. */
export function trimestresPourLeSeuil(f: FicheDuMarche, budget: number): number | null {
  const e = effortRse(f, budget);
  if (e <= f.rse.seuilDuLabel) return null;
  return Math.ceil(Math.log(1 - f.rse.seuilDuLabel / e) / Math.log(f.rse.inertie) - 1e-9);
}

/**
 * Les trimestres où le label joue : il est accordé, à partir du premier trimestre du label, au
 * trimestre dont le capital d'ouverture atteint le seuil, et joue pendant sa durée (lui et les
 * suivants). `accordes` : les trimestres où il est accordé (ou renouvelé).
 */
export function labelsDeLAnnee(f: FicheDuMarche, ouvertures: readonly number[]) {
  const r = f.rse;
  const accordes = ouvertures.flatMap((c, i) => (i + 1 >= r.premierTrimestreDuLabel && c >= r.seuilDuLabel - 1e-12 ? [i + 1] : []));
  const actifs = ouvertures.map((_, i) => accordes.some((t) => i + 1 >= t && i + 1 < t + r.dureeDuLabel));
  return { accordes, actifs, premier: accordes[0] ?? null };
}

/**
 * Le plan le moins cher qui porte le capital au seuil à la fin du trimestre n (parti de zéro), sans
 * borne d'un trimestre à l'autre : chaque euro doit y rapporter autant de capital, d'où (échelle +
 * budget du trimestre t) proportionnel à son poids. Les budgets sont exacts (non arrondis) ; un
 * budget qui serait négatif est mis à zéro et le calcul refait sur les autres trimestres.
 */
export function planLeMoinsCherDuLabel(f: FicheDuMarche, n = 3) {
  const poids = poidsDesTrimestres(f, n);
  const E = f.rse.echelle;
  let actifs = poids.map((_, i) => i);
  let budgets = poids.map(() => 0);
  for (let essai = 0; essai < n; essai++) {
    // Σ w ln((E + b) / E) = seuil, avec E + b = λ w : Σ w ln(λ w / E) = seuil.
    const W = somme(actifs.map((i) => poids[i]!));
    const lnLambda = (f.rse.seuilDuLabel - somme(actifs.map((i) => poids[i]! * Math.log(poids[i]! / E)))) / W;
    budgets = poids.map((w, i) => (actifs.includes(i) ? Math.exp(lnLambda) * w - E : 0));
    const negatifs = actifs.filter((i) => budgets[i]! < 0);
    if (negatifs.length === 0) break;
    actifs = actifs.filter((i) => !negatifs.includes(i));
  }
  budgets = budgets.map((b) => Math.max(0, b));
  return { budgets, total: somme(budgets) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. L'ENGAGEMENT RSE DANS L'ANNÉE
// ═════════════════════════════════════════════════════════════════════════════

export type VerdictDeLEngagement = "paie-deja" | "pas-encore" | "la-demande-ne-se-vend-pas";

/**
 * L'année de NOVA engagée (ses budgets RSE de chaque trimestre), face à l'année sans engagement, les
 * autres leviers tenus : le capital, les labels, la demande, les ventes et la marge gagnées, le coût
 * de l'engagement et l'écart de résultat. Le verdict : la marge gagnée paie-t-elle déjà
 * l'engagement, ou la demande gagnée ne se vend-elle même pas (la capacité) ?
 */
export function engagementRse(f: FicheDuMarche, budgets: readonly number[], leviers: Partial<Omit<LeviersDuMarche, "rse">> = {}) {
  const sans = anneeDuMarche(f, { ...leviers, rse: [0, 0, 0, 0] }).nova;
  const avec = anneeDuMarche(f, { ...leviers, rse: budgets }).nova;
  const ventesGagnees = avec.ventes - sans.ventes;
  const ecart = auCentime(avec.resultat - sans.resultat);
  const verdict: VerdictDeLEngagement = ventesGagnees === 0 ? "la-demande-ne-se-vend-pas" : ecart > 0 ? "paie-deja" : "pas-encore";
  return {
    budgets,
    capital: avec.capital,
    labels: avec.labels,
    sans,
    avec,
    cout: auCentime(avec.budgetRse - sans.budgetRse),
    demandeGagnee: avec.demande - sans.demande,
    ventesGagnees,
    margeGagnee: auCentime(avec.marge - sans.marge),
    ecart,
    /** La hausse d'attractivité qu'apporte le capital d'ouverture de chaque trimestre : sensibilité × capital. */
    haussesDAttractivite: avec.capital.ouvertures.map((c) => f.rse.sensibilite * c),
    verdict,
  };
}

export type VerdictDuLabel = "viser-le-label" | "pas-cette-annee";

/**
 * Viser le label avec un budget constant chaque trimestre de l'année : le capital à la fin du
 * trimestre 3, le trimestre où le label vient, le coût de l'année, et l'année jouée face à l'année
 * sans engagement et à l'année au budget du cours.
 */
export function viserLeLabel(f: FicheDuMarche, budget: number, leviers: Partial<Omit<LeviersDuMarche, "rse">> = {}) {
  const vers = engagementRse(f, TRIMESTRES.map(() => budget), leviers);
  const depart = engagementRse(f, TRIMESTRES.map(() => f.rse.budgetDuCours), leviers);
  const ecartAuDepart = auCentime(vers.avec.resultat - depart.avec.resultat);
  return {
    budget,
    effort: effortRse(f, budget),
    capitalT3: vers.capital.fins[2]!,
    labelAuTrimestre: vers.labels.premier,
    cout: vers.cout,
    coutEnPlus: auCentime(vers.cout - depart.cout),
    vers,
    depart,
    ecartAuSans: vers.ecart,
    ecartAuDepart,
    verdict: (ecartAuDepart > 0 ? "viser-le-label" : "pas-cette-annee") as VerdictDuLabel,
  };
}
