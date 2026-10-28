import type {
  CentreAuxiliaire,
  CentrePrincipal,
  CodeDeCentre,
  CodeDeCharge,
  CodeDeClientele,
  CodeDeReference,
  CodeDIndicateur,
  FicheDeGestion,
  ReferenceDeLaGamme,
} from "./nova-gestion";

/**
 * LE MODÈLE DU CONTRÔLE DE GESTION DU COURS : coûts, décisions, budgets.
 *
 * Tout se calcule sur la fiche de gestion (monde/nova-gestion.ts), en fonctions pures : la même
 * fiche et les mêmes leviers donnent toujours les mêmes chiffres. Chaque fonction qu'un
 * laboratoire lira prend ses leviers en paramètres, avec la fiche pour valeur de départ.
 *
 *   1. LE SEUIL DE RENTABILITÉ : marge sur coût variable (unitaire, totale, taux), seuil en
 *      quantité (à l'unité supérieure) et en valeur (charges fixes ÷ taux de marge), point mort
 *      (le jour où le chiffre d'affaires cumulé l'atteint, ventes régulières sur le mois), marge et
 *      indice de sécurité, levier opérationnel (marge ÷ résultat), seuil multi-produits (charges
 *      fixes ÷ taux de marge moyen, à composition constante).
 *   2. LE COÛT COMPLET : répartition primaire (charges × clés), prestations réciproques entre les
 *      deux centres auxiliaires (un système de deux équations, résolu exactement), répartition
 *      secondaire, coût des unités d'œuvre, chaîne des coûts (achat, production, revient),
 *      imputation rationnelle (coefficient = activité réelle ÷ activité normale ; différence
 *      d'incorporation = charges fixes − charges fixes imputées).
 *   3. LE COÛT PAR PRODUIT : coût direct (variable et publicité), charges communes imputées selon
 *      une clé (heures-machine, chiffre d'affaires, ou un mélange des deux), coût complet, marge sur
 *      coûts spécifiques, et ce que l'abandon d'une référence ferait au résultat ; la marge par
 *      unité de facteur rare (par heure-machine) et le plan de production qu'elle commande.
 *   4. LA DÉCISION : ventes = min(demande(prix), fabriqué + sous-traité), le résultat selon le prix,
 *      la production et la sous-traitance.
 *   5. LE BUDGET DE TRÉSORERIE : mois par mois, encaissements selon le délai de chaque clientèle
 *      (toutes taxes comprises), décaissements, TVA du mois déclarée et payée le mois suivant,
 *      trésorerie de fin de mois.
 *   6. LE TABLEAU DE BORD : les indicateurs de chaque mois et du semestre, et leurs voyants.
 *
 * CONVENTIONS : les montants sont au centime ; les taux et les coefficients ne sont pas arrondis
 * (c'est l'affichage qui arrondit). Un résultat négatif est une perte.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => auCentime(xs.reduce((t, x) => t + x, 0));
/** Arrondi à l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);
const plancher = (x: number) => Math.floor(x + 1e-9);

// ═════════════════════════════════════════════════════════════════════════════
// 1. LE SEUIL DE RENTABILITÉ
// ═════════════════════════════════════════════════════════════════════════════

/** Ce que le seuil de rentabilité demande : le prix, le coût variable d'une unité, les fixes et les ventes. */
export interface DonneesDuSeuil {
  prix: number;
  coutVariableUnitaire: number;
  chargesFixes: number;
  quantite: number;
  /** Les jours de la période, pour dater le point mort. */
  jours: number;
}

/** Les données du mois de référence, chacune remplaçable par un levier. */
export function donneesDuMois(f: FicheDeGestion, leviers: Partial<DonneesDuSeuil> = {}): DonneesDuSeuil {
  const m = f.moisDeReference;
  return {
    prix: m.prix,
    coutVariableUnitaire: m.coutVariable.composants + m.coutVariable.autres,
    chargesFixes: m.chargesFixes.loyer + m.chargesFixes.personnel + m.chargesFixes.amortissement,
    quantite: m.quantite,
    jours: m.jours,
    ...leviers,
  };
}

/**
 * Le compte de résultat différentiel et le seuil. Le seuil en valeur se calcule sur le taux de marge
 * exact (marge unitaire ÷ prix), pas sur un taux arrondi. Sans marge unitaire positive, il n'y a pas
 * de seuil (null) ; sans résultat, pas de levier opérationnel (null).
 */
export function seuilDeRentabilite(d: DonneesDuSeuil) {
  const chiffreDAffaires = auCentime(d.quantite * d.prix);
  const chargesVariables = auCentime(d.quantite * d.coutVariableUnitaire);
  const marge = auCentime(chiffreDAffaires - chargesVariables);
  const margeUnitaire = auCentime(d.prix - d.coutVariableUnitaire);
  const tauxDeMarge = margeUnitaire / d.prix;
  const resultat = auCentime(marge - d.chargesFixes);
  const aUnSeuil = margeUnitaire > 0;
  /** Le seuil en quantité, avant l'arrondi : charges fixes ÷ marge unitaire. */
  const seuilExact = aUnSeuil ? d.chargesFixes / margeUnitaire : null;
  const seuilValeur = aUnSeuil ? auCentime(d.chargesFixes / tauxDeMarge) : null;
  const margeDeSecurite = seuilValeur === null ? null : auCentime(chiffreDAffaires - seuilValeur);
  return {
    ...d,
    chiffreDAffaires,
    chargesVariables,
    marge,
    margeUnitaire,
    tauxDeMarge,
    resultat,
    seuilExact,
    seuilQuantite: seuilExact === null ? null : plafond(seuilExact),
    seuilValeur,
    margeDeSecurite,
    indiceDeSecurite: margeDeSecurite === null ? null : margeDeSecurite / chiffreDAffaires,
    levierOperationnel: resultat === 0 ? null : marge / resultat,
    /** Le jour de la période où le seuil est atteint, ou null s'il ne l'est pas. */
    pointMort: seuilValeur === null || seuilValeur > chiffreDAffaires ? null : plafond((seuilValeur / chiffreDAffaires) * d.jours),
  };
}

/**
 * Le seuil de plusieurs produits vendus ensemble, à composition constante : les charges fixes
 * divisées par le taux de marge moyen (marge totale ÷ chiffre d'affaires total). En quantités, chaque
 * produit garde sa part des ventes.
 */
export function seuilMultiProduits(produits: readonly { code: string; quantite: number; prix: number; coutVariableUnitaire: number }[], chargesFixes: number) {
  const chiffreDAffaires = somme(produits.map((p) => p.quantite * p.prix));
  const marge = somme(produits.map((p) => p.quantite * (p.prix - p.coutVariableUnitaire)));
  const tauxDeMarge = marge / chiffreDAffaires;
  const seuilValeur = auCentime(chargesFixes / tauxDeMarge);
  const part = seuilValeur / chiffreDAffaires;
  return {
    chiffreDAffaires,
    marge,
    chargesFixes,
    tauxDeMarge,
    resultat: auCentime(marge - chargesFixes),
    seuilValeur,
    indiceDeSecurite: (chiffreDAffaires - seuilValeur) / chiffreDAffaires,
    /** Les quantités du seuil, produit par produit, à la composition des ventes (non arrondies). */
    seuilParProduit: produits.map((p) => ({ code: p.code, quantite: p.quantite * part, chiffreDAffaires: auCentime(p.quantite * p.prix * part) })),
  };
}

/**
 * Le point mort sur plusieurs mois : le mois (0 pour le premier) et le jour où le chiffre d'affaires
 * cumulé atteint le seuil de la période, les ventes de chaque mois étant régulières sur ses jours.
 */
export function pointMortSurLaPeriode(chiffresDAffaires: readonly number[], jours: readonly number[], seuilValeur: number): { mois: number; jour: number } | null {
  let cumul = 0;
  for (let m = 0; m < chiffresDAffaires.length; m++) {
    const ca = chiffresDAffaires[m]!;
    if (ca > 0 && cumul + ca >= seuilValeur - 1e-9) return { mois: m, jour: Math.max(1, plafond(((seuilValeur - cumul) / ca) * jours[m]!)) };
    cumul += ca;
  }
  return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. LE COÛT COMPLET ET LES CENTRES D'ANALYSE
// ═════════════════════════════════════════════════════════════════════════════

const CENTRES: readonly CodeDeCentre[] = ["entretien", "administration", "approvisionnement", "production", "distribution"];
const PRINCIPAUX: readonly CentrePrincipal[] = ["approvisionnement", "production", "distribution"];
const AUXILIAIRES: readonly CentreAuxiliaire[] = ["entretien", "administration"];
const CHARGES: readonly CodeDeCharge[] = ["loyer", "personnel", "amortissement"];

const parCentre = <T>(f: (c: CodeDeCentre) => T) => Object.fromEntries(CENTRES.map((c) => [c, f(c)])) as Record<CodeDeCentre, T>;
const parPrincipal = <T>(f: (c: CentrePrincipal) => T) => Object.fromEntries(PRINCIPAUX.map((c) => [c, f(c)])) as Record<CentrePrincipal, T>;

/** La répartition primaire : chaque centre reçoit la somme des charges × sa clé. */
export function repartitionPrimaire(f: FicheDeGestion): Record<CodeDeCentre, number> {
  const ch = f.moisDeReference.chargesFixes;
  return parCentre((c) => somme(CHARGES.map((k) => ch[k] * f.centres.primaire[k][c])));
}

/**
 * LES PRESTATIONS RÉCIPROQUES. Chaque centre auxiliaire se répartit pour son total : ses charges
 * primaires, plus ce que l'autre lui cède. En notant e la part que l'administration cède à
 * l'entretien et a la part que l'entretien cède à l'administration :
 *
 *   Entretien = Entretien primaire + e × Administration
 *   Administration = Administration primaire + a × Entretien
 *
 * Le système se résout exactement par substitution : Entretien = (E₀ + e × A₀) ÷ (1 − a × e), et
 * de même pour l'administration ; les totaux sont arrondis au centime une seule fois, à la fin.
 */
export function prestationsReciproques(f: FicheDeGestion, primaire: Readonly<Record<CodeDeCentre, number>> = repartitionPrimaire(f)) {
  const e = f.centres.secondaire.administration.entretien;
  const a = f.centres.secondaire.entretien.administration;
  const E0 = primaire.entretien;
  const A0 = primaire.administration;
  const determinant = 1 - a * e;
  return {
    /** La part que l'administration cède à l'entretien, et celle que l'entretien cède à l'administration. */
    partCedeeALEntretien: e,
    partCedeeALAdministration: a,
    entretien: auCentime((E0 + e * A0) / determinant),
    administration: auCentime((A0 + a * E0) / determinant),
  };
}

/**
 * La répartition complète : primaire, prestations réciproques, puis ce que chaque centre
 * auxiliaire cède à chaque centre (son total × sa clé), et le total de chaque centre principal.
 */
export function repartitionDesCentres(f: FicheDeGestion) {
  const primaire = repartitionPrimaire(f);
  const totaux = prestationsReciproques(f, primaire);
  const cessions = Object.fromEntries(
    AUXILIAIRES.map((x) => [x, parCentre((c) => auCentime(totaux[x] * f.centres.secondaire[x][c]))]),
  ) as Record<CentreAuxiliaire, Record<CodeDeCentre, number>>;
  const principaux = parPrincipal((c) => somme([primaire[c], cessions.entretien[c], cessions.administration[c]]));
  return {
    primaire,
    /** Le total de chaque centre auxiliaire après les prestations réciproques. */
    auxiliaires: { entretien: totaux.entretien, administration: totaux.administration },
    cessions,
    principaux,
    total: somme(CHARGES.map((k) => f.moisDeReference.chargesFixes[k])),
  };
}

/** Les leviers du coût complet d'un mois : les ventes et le prix (les charges indirectes ne bougent pas). */
export interface LeviersDuCoutComplet {
  quantite: number;
  prix: number;
}

/** L'activité de chaque centre principal dans son unité d'œuvre, pour une quantité et un prix. */
function activiteDesCentres(f: FicheDeGestion, quantite: number, prix: number): Record<CentrePrincipal, number> {
  const valeur = { achats: quantite * f.moisDeReference.coutVariable.composants, quantite, chiffreDAffaires: quantite * prix };
  return parPrincipal((c) => valeur[f.centres.unitesDOeuvre[c].nature] / f.centres.unitesDOeuvre[c].assiette);
}

/**
 * Le coût complet du mois, d'une seule référence : les centres (fixes, ils ne dépendent pas des
 * ventes), le coût de chaque unité d'œuvre, la chaîne des coûts et le résultat analytique.
 */
export function coutCompletDuMois(f: FicheDeGestion, leviers: Partial<LeviersDuCoutComplet> = {}) {
  const m = f.moisDeReference;
  const quantite = leviers.quantite ?? m.quantite;
  const prix = leviers.prix ?? m.prix;
  const centres = repartitionDesCentres(f);
  const activite = activiteDesCentres(f, quantite, prix);
  const achats = auCentime(quantite * m.coutVariable.composants);
  const autres = auCentime(quantite * m.coutVariable.autres);
  const chiffreDAffaires = auCentime(quantite * prix);
  const coutDAchat = somme([achats, centres.principaux.approvisionnement]);
  const coutDeProduction = somme([coutDAchat, autres, centres.principaux.production]);
  const coutDeRevient = somme([coutDeProduction, centres.principaux.distribution]);
  return {
    quantite,
    prix,
    centres,
    activite,
    /** Le coût de chaque unité d'œuvre, non arrondi (l'élève l'arrondit au centime pour l'écrire). */
    coutDesUnitesDOeuvre: parPrincipal((c) => centres.principaux[c] / activite[c]),
    achats,
    autres,
    chiffreDAffaires,
    coutDAchat,
    coutDeProduction,
    coutDeRevient,
    coutDeRevientUnitaire: coutDeRevient / quantite,
    resultat: auCentime(chiffreDAffaires - coutDeRevient),
  };
}

/**
 * L'IMPUTATION RATIONNELLE des charges fixes d'un centre : elles s'imputent au coefficient activité
 * réelle ÷ activité normale. La différence d'incorporation, charges fixes − charges imputées, est un
 * coût de sous-activité quand elle est positive, un boni de suractivité quand elle est négative.
 */
export function imputationRationnelle(chargesFixes: number, activiteReelle: number, activiteNormale: number) {
  const coefficient = activiteReelle / activiteNormale;
  const imputees = auCentime(chargesFixes * coefficient);
  return { coefficient, imputees, difference: auCentime(chargesFixes - imputees) };
}

/**
 * Le coût complet du mois en imputation rationnelle. Toutes les charges des centres sont fixes : chaque
 * centre principal impute les siennes au coefficient de son activité (activité réelle ÷ activité
 * normale, chacune dans l'unité d'œuvre du centre), et la différence d'incorporation se retranche du
 * résultat analytique. Le résultat final est le même qu'en coût complet ; le coût d'une enceinte, lui,
 * ne dépend plus des ventes du mois.
 */
export function coutCompletRationnel(f: FicheDeGestion, leviers: Partial<LeviersDuCoutComplet> = {}) {
  const complet = coutCompletDuMois(f, leviers);
  const normale = activiteDesCentres(f, f.centres.activiteNormale, complet.prix);
  const parCentreIR = parPrincipal((c) => imputationRationnelle(complet.centres.principaux[c], complet.activite[c], normale[c]));
  const coutDAchat = somme([complet.achats, parCentreIR.approvisionnement.imputees]);
  const coutDeProduction = somme([coutDAchat, complet.autres, parCentreIR.production.imputees]);
  const coutDeRevient = somme([coutDeProduction, parCentreIR.distribution.imputees]);
  const differences = somme(PRINCIPAUX.map((c) => parCentreIR[c].difference));
  const resultatAvantDifferences = auCentime(complet.chiffreDAffaires - coutDeRevient);
  return {
    quantite: complet.quantite,
    activiteNormale: f.centres.activiteNormale,
    coefficient: complet.quantite / f.centres.activiteNormale,
    parCentre: parCentreIR,
    coutDAchat,
    coutDeProduction,
    coutDeRevient,
    coutDeRevientUnitaire: coutDeRevient / complet.quantite,
    resultatAvantDifferences,
    /** La somme des différences d'incorporation : coût de sous-activité (positif) ou boni (négatif). */
    differences,
    resultat: auCentime(resultatAvantDifferences - differences),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LE COÛT PAR PRODUIT ET LE FACTEUR RARE
// ═════════════════════════════════════════════════════════════════════════════

/** Les leviers du coût par produit. */
export interface LeviersDeLaGamme {
  /**
   * La part des charges communes répartie aux heures-machine (1 : toutes ; 0 : toutes au chiffre
   * d'affaires ; entre les deux, un mélange des deux clés).
   */
  partAuxHeures: number;
  /** Le prix d'une référence, à la place de celui de la fiche (les quantités ne bougent pas). */
  prix: Partial<Record<CodeDeReference, number>>;
  /** Les heures-machine d'une unité d'une référence, à la place de celles de la fiche. */
  heuresMachineParUnite: Partial<Record<CodeDeReference, number>>;
}

/**
 * Répartit un montant au centime selon des poids, par la méthode du plus fort reste : chaque part
 * est arrondie au centime inférieur, puis les centimes qui manquent vont aux plus grands restes. La
 * somme des parts retombe exactement sur le montant.
 */
function repartirAuCentime(montant: number, poids: readonly number[]): number[] {
  const total = poids.reduce((t, p) => t + p, 0);
  const centimes = Math.round(montant * 100);
  const exactes = poids.map((p) => (centimes * p) / total);
  const parts = exactes.map((x) => plancher(x));
  let reste = centimes - parts.reduce((t, p) => t + p, 0);
  const ordre = exactes.map((x, i) => ({ i, r: x - plancher(x) })).sort((u, v) => v.r - u.r || u.i - v.i);
  for (const { i } of ordre) {
    if (reste <= 0) break;
    parts[i]! += 1;
    reste -= 1;
  }
  return parts.map((p) => p / 100);
}

/**
 * Le coût complet et le résultat de chaque référence du mois en gamme, selon la clé choisie. Les
 * charges communes s'imputent au prorata exact de la clé (pas au coût d'unité d'œuvre arrondi), pour
 * que leur somme retombe sur leur total quelle que soit la clé : le résultat de la gamme n'en dépend pas.
 */
export function coutsDeLaGamme(f: FicheDeGestion, leviers: Partial<LeviersDeLaGamme> = {}) {
  const g = f.gamme;
  const s = leviers.partAuxHeures ?? 1;
  const refs = g.references.map((r) => ({
    ...r,
    prix: leviers.prix?.[r.code] ?? r.prix,
    heuresMachineParUnite: leviers.heuresMachineParUnite?.[r.code] ?? r.heuresMachineParUnite,
  }));
  const communes = somme([g.communes.loyer, g.communes.personnel, g.communes.entretien, g.communes.usure]);
  const lignes = refs.map((r) => {
    const chiffreDAffaires = auCentime(r.quantite * r.prix);
    const variables = auCentime(r.quantite * r.coutVariableUnitaire);
    return { ...r, chiffreDAffaires, variables, direct: auCentime(variables + r.publicite), heures: r.quantite * r.heuresMachineParUnite };
  });
  const heures = lignes.reduce((t, l) => t + l.heures, 0);
  const chiffreDAffaires = somme(lignes.map((l) => l.chiffreDAffaires));
  const imputees = repartirAuCentime(
    communes,
    lignes.map((l) => s * (l.heures / heures) + (1 - s) * (l.chiffreDAffaires / chiffreDAffaires)),
  );
  const parReference = lignes.map((l, i) => {
    const coutComplet = auCentime(l.direct + imputees[i]!);
    return {
      ...l,
      imputees: imputees[i]!,
      coutComplet,
      resultat: auCentime(l.chiffreDAffaires - coutComplet),
      /** Ce que la référence rapporte une fois payées ses seules charges propres : ce que son abandon ferait perdre. */
      margeSpecifique: auCentime(l.chiffreDAffaires - l.direct),
      margeSurCoutVariable: auCentime(l.chiffreDAffaires - l.variables),
    };
  });
  const resultat = somme(parReference.map((l) => l.resultat));
  return {
    partAuxHeures: s,
    communes,
    heures,
    chiffreDAffaires,
    /** Le coût d'une heure-machine et celui de 100 € de chiffre d'affaires, non arrondis. */
    coutDeLHeure: communes / heures,
    coutPourCentEurosDeChiffreDAffaires: communes / (chiffreDAffaires / 100),
    parReference,
    directs: somme(parReference.map((l) => l.direct)),
    publicite: somme(parReference.map((l) => l.publicite)),
    resultat,
    /** Le seuil de la gamme, à sa composition : charges communes et publicité ÷ taux de marge moyen. */
    seuil: seuilMultiProduits(refs, somme([communes, ...refs.map((r) => r.publicite)])),
  };
}

/** Le résultat de la gamme sans une référence : ses charges propres partent, les charges communes restent. */
export function resultatSansLaReference(gamme: ReturnType<typeof coutsDeLaGamme>, code: CodeDeReference) {
  const r = gamme.parReference.find((l) => l.code === code)!;
  return auCentime(gamme.resultat - r.margeSpecifique);
}

/** Les leviers du facteur rare : la demande de chaque référence et les heures-machine du mois. */
export interface LeviersDuFacteurRare {
  classement: "marge-par-heure" | "marge-par-unite";
  demandes: Partial<Record<CodeDeReference, number>>;
  capaciteHeuresMachine: number;
}

/**
 * LE FACTEUR RARE : quand la demande demande plus d'heures-machine que les lignes n'en donnent, on
 * sert d'abord la référence qui rapporte le plus par heure-machine (marge sur coût variable d'une
 * unité ÷ ses heures), puis la suivante, jusqu'à épuiser les heures (à l'unité entière). Le classement
 * « marge-par-unite » montre ce que donnerait le mauvais critère.
 */
export function planSousFacteurRare(f: FicheDeGestion, leviers: Partial<LeviersDuFacteurRare> = {}) {
  const classement = leviers.classement ?? "marge-par-heure";
  const capacite = leviers.capaciteHeuresMachine ?? f.gamme.capaciteHeuresMachine;
  const refs = f.gamme.references.map((r: ReferenceDeLaGamme) => {
    const margeUnitaire = r.prix - r.coutVariableUnitaire;
    return { code: r.code, nom: r.nom, margeUnitaire, margeParHeure: margeUnitaire / r.heuresMachineParUnite, heuresMachineParUnite: r.heuresMachineParUnite, demande: leviers.demandes?.[r.code] ?? r.demandeDuMoisDePointe };
  });
  const cle = (r: (typeof refs)[number]) => (classement === "marge-par-heure" ? r.margeParHeure : r.margeUnitaire);
  const ordre = [...refs].sort((u, v) => cle(v) - cle(u));
  let reste = capacite;
  const plan = ordre.map((r) => {
    const quantite = Math.min(r.demande, plancher(reste / r.heuresMachineParUnite));
    const heures = quantite * r.heuresMachineParUnite;
    reste -= heures;
    return { ...r, quantite, heures, nonServie: r.demande - quantite, marge: auCentime(quantite * r.margeUnitaire) };
  });
  return {
    classement,
    capacite,
    heuresDemandees: refs.reduce((t, r) => t + r.demande * r.heuresMachineParUnite, 0),
    plan,
    heuresUtilisees: plan.reduce((t, r) => t + r.heures, 0),
    marge: somme(plan.map((r) => r.marge)),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LA DÉCISION : PRIX, FABRIQUER OU ACHETER
// ═════════════════════════════════════════════════════════════════════════════

/** La demande du trimestre au prix p : la droite de la fiche, à l'unité inférieure, jamais négative. */
export function demandeAuPrix(f: FicheDeGestion, prix: number) {
  return Math.max(0, plancher(f.decision.demande.aPrixNul - f.decision.demande.perdueParEuro * prix));
}

/** Les leviers du trimestre de décision. */
export interface LeviersDeLaDecision {
  prix: number;
  /** Les enceintes que la ligne fabrique dans le trimestre, ramenées à sa capacité. */
  production: number;
  /**
   * Le plafond de la sous-traitance : les enceintes que NOVA accepte de faire fabriquer. Le
   * sous-traitant livre sur commande ferme : NOVA ne lui achète que ce qui sert une demande que la
   * ligne ne couvre pas, dans la limite de ce plafond.
   */
  sousTraitance: number;
}

/**
 * Le trimestre de décision. Les ventes valent la plus petite des deux quantités, la demande au prix ou
 * ce qui est disponible (le fabriqué, puis le sous-traité). Une enceinte fabriquée coûte son coût
 * variable, une enceinte sous-traitée le prix du sous-traitant ; les charges fixes ne bougent pas.
 * HYPOTHÈSE DU COURS : ce qui est fabriqué et ne se vend pas reste en stock à son coût variable ; il
 * ne pèse pas sur le résultat du trimestre (méthode du coût variable), mais il a été payé.
 */
export function trimestreDeDecision(f: FicheDeGestion, leviers: Partial<LeviersDeLaDecision> = {}) {
  const d = f.decision;
  const prix = leviers.prix ?? d.prix;
  const production = Math.max(0, Math.min(d.capacite, leviers.production ?? d.production));
  const plafondSousTraite = Math.max(0, leviers.sousTraitance ?? 0);
  const coutVariableUnitaire = f.moisDeReference.coutVariable.composants + f.moisDeReference.coutVariable.autres;
  const demande = demandeAuPrix(f, prix);
  const fabriqueesVendues = Math.min(demande, production);
  const sousTraitees = Math.min(plafondSousTraite, demande - fabriqueesVendues);
  const ventes = fabriqueesVendues + sousTraitees;
  const chiffreDAffaires = auCentime(ventes * prix);
  const coutVariable = auCentime(fabriqueesVendues * coutVariableUnitaire + sousTraitees * d.coutDuSousTraitant);
  const marge = auCentime(chiffreDAffaires - coutVariable);
  return {
    prix,
    production,
    demande,
    fabriqueesVendues,
    sousTraitees,
    ventes,
    nonServie: demande - ventes,
    stock: production - fabriqueesVendues,
    capaciteRestante: d.capacite - production,
    chiffreDAffaires,
    coutVariable,
    marge,
    margeFabriquee: auCentime(prix - coutVariableUnitaire),
    margeSousTraitee: auCentime(prix - d.coutDuSousTraitant),
    chargesFixes: d.chargesFixes,
    resultat: auCentime(marge - d.chargesFixes),
  };
}

/**
 * Le meilleur prix d'une grille quand toute la demande est servie : la ligne fabrique ce qu'elle
 * peut, le sous-traitant le reste. Le premier prix de la grille qui donne le meilleur résultat.
 */
export function meilleurPrixSansDemandeNonServie(f: FicheDeGestion, grille: { min: number; max: number; pas: number }) {
  let meilleur: ReturnType<typeof trimestreDeDecision> | null = null;
  const n = Math.round((grille.max - grille.min) / grille.pas);
  for (let k = 0; k <= n; k++) {
    const prix = auCentime(grille.min + k * grille.pas);
    const demande = demandeAuPrix(f, prix);
    const t = trimestreDeDecision(f, { prix, production: Math.min(demande, f.decision.capacite), sousTraitance: Math.max(0, demande - f.decision.capacite) });
    if (!meilleur || t.resultat > meilleur.resultat) meilleur = t;
  }
  return meilleur!;
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LE BUDGET DE TRÉSORERIE
// ═════════════════════════════════════════════════════════════════════════════

/** Les leviers du semestre, ceux du budget de trésorerie et du tableau de bord. */
export interface LeviersDuSemestre {
  /** La hausse des ventes de chaque mois, toutes clientèles (0,1 : 10 % de plus), à l'unité près. */
  hausseDesVentes: number;
  /** Le prix d'une enceinte, hors taxes (les quantités ne répondent pas au prix ici). */
  prix: number;
  /** Le délai de paiement de chaque clientèle, en jours (0 : comptant). */
  delais: Readonly<Record<CodeDeClientele, number>>;
  /** Le délai de paiement du fournisseur de composants, en jours. */
  delaiFournisseur: number;
  /** L'investissement retenu, ou null : son mois (0 pour janvier) et son montant hors taxes. */
  investissement: { mois: number; montantHt: number } | null;
  /** Un budget de publicité, hors taxes, chaque mois (une charge fixe en plus). */
  budgetMarketing: number;
}

/** Les leviers de la fiche : ventes, prix et délais du semestre, sans investissement ni publicité. */
export function leviersDeBase(f: FicheDeGestion): LeviersDuSemestre {
  return {
    hausseDesVentes: 0,
    prix: f.moisDeReference.prix,
    delais: Object.fromEntries(f.semestre.clienteles.map((c) => [c.code, c.delai])) as Record<CodeDeClientele, number>,
    delaiFournisseur: f.semestre.fournisseur.delai,
    investissement: null,
    budgetMarketing: 0,
  };
}

/** L'investissement de la fiche, tel qu'un laboratoire le retient. */
export function investissementDeLaFiche(f: FicheDeGestion): { mois: number; montantHt: number } {
  return { mois: f.semestre.investissement.mois, montantHt: f.semestre.investissement.montantHt };
}

/**
 * Le décalage, en mois, entre une facture et son paiement : le mois (de 30 jours) où tombe
 * l'échéance, compté depuis le mois de la facture. Comptant : le mois même.
 */
export function moisDeDecalage(jourDeFacturation: number, delai: number, joursDuMois: number) {
  return delai <= 0 ? 0 : plafond((jourDeFacturation + delai) / joursDuMois) - 1;
}

/** Les enceintes de chaque clientèle, mois par mois, avec la hausse des ventes. */
function quantitesDuSemestre(f: FicheDeGestion, hausse: number) {
  return f.semestre.clienteles.map((c) => ({ code: c.code, quantites: c.quantites.map((q) => Math.round(q * (1 + hausse))) }));
}

/**
 * LE BUDGET DE TRÉSORERIE DU SEMESTRE, mois par mois, toutes taxes comprises.
 *
 *   · Encaissements : chaque clientèle paie ses ventes TTC au mois de son échéance ; ce qui tombe
 *     après juin reste en créances clients.
 *   · Décaissements : les composants TTC au mois de l'échéance du fournisseur ; les autres coûts
 *     variables et la publicité TTC, le loyer (sans TVA) et les salaires nets dans le mois ; les
 *     cotisations du mois le mois suivant ; l'échéance de l'emprunt (capital et intérêts du
 *     trimestre) le dernier mois de chaque trimestre ; l'investissement TTC le mois de sa livraison.
 *   · TVA : la TVA du mois (collectée sur les ventes, moins la TVA déductible sur les composants,
 *     les autres coûts, la publicité et l'investissement) se déclare et se paie le mois suivant ; un
 *     crédit de TVA se reporte sur la déclaration suivante.
 *   · Trésorerie de fin = trésorerie de début + encaissements − décaissements.
 */
export function budgetDeTresorerie(f: FicheDeGestion, leviers: Partial<LeviersDuSemestre> = {}) {
  const l = { ...leviersDeBase(f), ...leviers };
  const s = f.semestre;
  const n = s.mois.length;
  const tva = s.tauxDeTva;
  const m = f.moisDeReference;
  const quantites = quantitesDuSemestre(f, l.hausseDesVentes);
  const total = (k: number) => quantites.reduce((t, c) => t + c.quantites[k]!, 0);

  const encaissements = Array.from({ length: n }, () => Object.fromEntries(s.clienteles.map((c) => [c.code, 0])) as Record<CodeDeClientele, number>);
  let creancesClients = 0;
  for (const c of s.clienteles) {
    const decalage = moisDeDecalage(c.jourDeFacturation, l.delais[c.code], s.joursDuMoisCommercial);
    const q = quantites.find((x) => x.code === c.code)!.quantites;
    q.forEach((qte, k) => {
      const ttc = auCentime(qte * l.prix * (1 + tva));
      if (k + decalage < n) encaissements[k + decalage]![c.code] = auCentime(encaissements[k + decalage]![c.code] + ttc);
      else creancesClients = auCentime(creancesClients + ttc);
    });
  }

  const decalageFournisseur = moisDeDecalage(s.fournisseur.jourDeFacturation, l.delaiFournisseur, s.joursDuMoisCommercial);
  const fournisseur = Array.from({ length: n }, () => 0);
  let dettesFournisseurs = 0;
  for (let k = 0; k < n; k++) {
    const ttc = auCentime(total(k) * m.coutVariable.composants * (1 + tva));
    if (k + decalageFournisseur < n) fournisseur[k + decalageFournisseur] = auCentime(fournisseur[k + decalageFournisseur]! + ttc);
    else dettesFournisseurs = auCentime(dettesFournisseurs + ttc);
  }

  let capitalRestantDu = s.emprunt.capitalRestantDu;
  let creditDeTva = 0;
  let tvaAPayer = 0;
  let cotisationsDues = 0;
  let tresorerie = s.tresorerieDeDepart;
  const mois = s.mois.map((info, k) => {
    const quantite = total(k);
    const ventesHt = auCentime(quantite * l.prix);
    const tvaCollectee = auCentime(ventesHt * tva);
    const autresHt = auCentime(quantite * m.coutVariable.autres);
    const achatsHt = auCentime(quantite * m.coutVariable.composants);
    const investissementHt = l.investissement && l.investissement.mois === k ? l.investissement.montantHt : 0;
    const tvaDeductible = auCentime((achatsHt + autresHt + l.budgetMarketing + investissementHt) * tva);
    const solde = auCentime(tvaCollectee - tvaDeductible);
    const echeance = s.emprunt.moisDesEcheances.includes(k);
    const interets = echeance ? auCentime((capitalRestantDu * s.emprunt.tauxAnnuel * 3) / 12) : 0;
    const capital = echeance ? Math.min(s.emprunt.capitalParEcheance, capitalRestantDu) : 0;
    capitalRestantDu = auCentime(capitalRestantDu - capital);

    const enc = encaissements[k]!;
    const totalEncaissements = somme(Object.values(enc));
    const decaissements = {
      fournisseur: fournisseur[k]!,
      autresCoutsVariables: auCentime(autresHt * (1 + tva)),
      publicite: auCentime(l.budgetMarketing * (1 + tva)),
      loyer: m.chargesFixes.loyer,
      salairesNets: s.paie.net,
      cotisations: cotisationsDues,
      tva: tvaAPayer,
      emprunt: auCentime(capital + interets),
      investissement: auCentime(investissementHt * (1 + tva)),
    };
    const totalDecaissements = somme(Object.values(decaissements));
    const debut = tresorerie;
    tresorerie = auCentime(debut + totalEncaissements - totalDecaissements);
    // La déclaration du mois, payée le mois suivant ; le crédit d'un mois s'impute sur le suivant.
    const net = auCentime(solde - creditDeTva);
    tvaAPayer = Math.max(0, net);
    creditDeTva = Math.max(0, -net);
    cotisationsDues = s.paie.cotisations;
    return {
      nom: info.nom,
      quantite,
      ventesHt,
      ventesTtc: auCentime(ventesHt + tvaCollectee),
      achatsTtc: auCentime(achatsHt * (1 + tva)),
      encaissements: { ...enc, total: totalEncaissements },
      decaissements: { ...decaissements, total: totalDecaissements },
      tva: { collectee: tvaCollectee, deductible: tvaDeductible, solde, aPayerLeMoisSuivant: tvaAPayer, creditReporte: creditDeTva },
      emprunt: { capital, interets },
      tresorerieDebut: debut,
      tresorerieFin: tresorerie,
    };
  });
  const plusBas = mois.reduce((x, y) => (y.tresorerieFin < x.tresorerieFin ? y : x));
  return {
    leviers: l,
    mois,
    /** Ce qui reste dû au 30 juin, dans un sens et dans l'autre. */
    fin: { creancesClients, dettesFournisseurs, cotisationsDues, tvaDue: tvaAPayer, creditDeTva, capitalRestantDu },
    totaux: {
      ventesTtc: somme(mois.map((x) => x.ventesTtc)),
      achatsTtc: somme(mois.map((x) => x.achatsTtc)),
      encaissements: somme(mois.map((x) => x.encaissements.total)),
      decaissements: somme(mois.map((x) => x.decaissements.total)),
    },
    tresorerieFin: tresorerie,
    plusBas: { nom: plusBas.nom, tresorerie: plusBas.tresorerieFin },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. LE TABLEAU DE BORD
// ═════════════════════════════════════════════════════════════════════════════

/** Un voyant s'allume quand l'indicateur passe sous son seuil d'alerte. */
export function voyantAllume(f: FicheDeGestion, indicateur: CodeDIndicateur, valeur: number) {
  return valeur < f.seuilsDAlerte[indicateur];
}

const voyantsDe = (f: FicheDeGestion, v: Record<CodeDIndicateur, number>) =>
  Object.fromEntries((Object.keys(f.seuilsDAlerte) as CodeDIndicateur[]).map((k) => [k, voyantAllume(f, k, v[k])])) as Record<CodeDIndicateur, boolean>;

/**
 * Les indicateurs de chaque mois du semestre et du semestre entier : chiffre d'affaires, marge sur
 * coût variable et son taux, charges fixes (celles du mois, la publicité, et l'usure de
 * l'investissement dès son mois), résultat, seuil en valeur et indice de sécurité, trésorerie de fin
 * (celle du budget), part de marché ; et les voyants. Sur le semestre, le voyant de trésorerie lit le
 * mois le plus bas, et la part de marché rapporte les ventes du semestre à celles du marché.
 */
export function tableauDeBord(f: FicheDeGestion, leviers: Partial<LeviersDuSemestre> = {}) {
  const budget = budgetDeTresorerie(f, leviers);
  const l = budget.leviers;
  const fixes = donneesDuMois(f).chargesFixes;
  const cv = donneesDuMois(f).coutVariableUnitaire;
  const inv = l.investissement;
  const usureDeLInvestissement = inv ? auCentime(inv.montantHt / f.semestre.investissement.dureeDAmortissementMois) : 0;
  const indicateurs = (chiffreDAffaires: number, marge: number, chargesFixes: number) => {
    const tauxDeMarge = marge / chiffreDAffaires;
    const seuil = auCentime(chargesFixes / tauxDeMarge);
    return { chiffreDAffaires, marge, chargesFixes, tauxDeMarge, resultat: auCentime(marge - chargesFixes), seuil, indiceDeSecurite: (chiffreDAffaires - seuil) / chiffreDAffaires };
  };
  const mois = budget.mois.map((b, k) => {
    const chargesFixes = auCentime(fixes + l.budgetMarketing + (inv && k >= inv.mois ? usureDeLInvestissement : 0));
    const i = indicateurs(b.ventesHt, auCentime(b.quantite * (l.prix - cv)), chargesFixes);
    const partDeMarche = b.quantite / f.semestre.marche[k]!;
    return {
      nom: b.nom,
      quantite: b.quantite,
      ...i,
      tresorerie: b.tresorerieFin,
      partDeMarche,
      voyants: voyantsDe(f, { indiceDeSecurite: i.indiceDeSecurite, resultat: i.resultat, tresorerie: b.tresorerieFin, partDeMarche }),
    };
  });
  const quantite = mois.reduce((t, x) => t + x.quantite, 0);
  const i = indicateurs(somme(mois.map((x) => x.chiffreDAffaires)), somme(mois.map((x) => x.marge)), somme(mois.map((x) => x.chargesFixes)));
  const partDeMarche = quantite / f.semestre.marche.reduce((t, x) => t + x, 0);
  return {
    mois,
    semestre: {
      quantite,
      ...i,
      tresoreriePlusBasse: budget.plusBas.tresorerie,
      partDeMarche,
      voyants: voyantsDe(f, { indiceDeSecurite: i.indiceDeSecurite, resultat: i.resultat, tresorerie: budget.plusBas.tresorerie, partDeMarche }),
    },
    budget,
  };
}
