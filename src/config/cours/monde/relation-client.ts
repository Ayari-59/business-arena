import type {
  CanalDeConquete,
  CodeDeCanal,
  CodeDeClientele,
  CodeDeCommercial,
  CodeDePartenaire,
  CodeDIndicateurCommercial,
  CommercialDuCabinet,
  CompteClient,
  FicheDuCabinet,
  SeuilDAlerte,
  Trimestre,
} from "./atlas-conseil";

/**
 * LE MODÈLE DE LA RELATION CLIENT DU COURS : le cabinet ATLAS CONSEIL, l'année N trimestre par
 * trimestre (le parcours BTS NDRC).
 *
 * Tout se calcule sur la fiche (monde/atlas-conseil.ts), en fonctions pures : la même fiche et les
 * mêmes leviers donnent toujours les mêmes chiffres. Chaque fonction qu'un curseur ou un laboratoire
 * lira prend ses leviers en paramètres, avec la fiche pour valeur de départ.
 *
 *   1. LE PRIX PLANCHER ET LA MARGE DE MANŒUVRE : coût variable d'une journée, part des charges fixes
 *      (charges fixes de l'année ÷ journées vendues), coût complet, marge de manœuvre (prix catalogue
 *      − coût complet), remise maximale ; une remise demandée, et sa contrepartie en journées (le
 *      volume qui garde la marge sur coût variable) ; une baisse de prix accordée à tous, clientèle par
 *      clientèle (élasticité), et les clientèles qui tiennent le mieux le prix.
 *   2. LA CAPACITÉ ET L'AFFAIRE ACCEPTABLE : les journées de chaque trimestre (capacité, vendues,
 *      libres, refusées, taux d'occupation et de service) ; une affaire en plus à un prix bas, qui ne
 *      prend que des journées libres ou qui en prend à des clients au prix catalogue ; son plancher, et
 *      les jours libres qu'il lui faut.
 *   3. LA VALEUR D'UN CLIENT : marge annuelle d'un compte, attrition et fidélisation, durée de vie
 *      (1 ÷ attrition), valeur vie client simple (marge ÷ attrition) et actualisée (marge ÷ (attrition
 *      + taux)), les marges attendues année par année, le rapport valeur vie ÷ coût d'acquisition, le
 *      portefeuille d'équilibre (recrues ÷ attrition) face à la capacité, recruter ou fidéliser.
 *   4. L'ENTONNOIR ET LE COÛT D'ACQUISITION : contacts → rendez-vous → devis → contrats, canal par canal,
 *      les taux de chaque marche (dont le taux de transformation des devis) et le coût d'acquisition ;
 *      la courbe de la campagne, interpolée entre ses cinq paliers ; le compte en plus (coût marginal)
 *      et le budget où le dernier euro ne rapporte plus.
 *   5. LES PARTENAIRES ET LA COMMISSION : la valeur vie d'un compte apporté, commissions déduites,
 *      face à celle d'un compte gagné en propre (coût d'acquisition déduit) ; la commission plafond ; la
 *      part de comptes revenus en direct qu'il faudrait.
 *   6. LE PORTEFEUILLE ABC : le classement par le chiffre d'affaires, puis par la marge, les parts
 *      cumulées et les classes ; les comptes qui sortent de A et ceux qui y entrent.
 *   7. LE TABLEAU DE BORD COMMERCIAL : coût d'un commercial, taux de marge de ses comptes, SEUIL DE
 *      RENTABILITÉ D'UN COMMERCIAL (son coût ÷ (taux de marge − taux de commission)) ; trimestre par
 *      trimestre, rendez-vous, devis, contrats, taux de transformation des devis, panier moyen,
 *      réalisation de l'objectif, évolution sur N − 1, et leurs voyants.
 *
 * CONVENTIONS : les montants sont au centime ; les taux, les parts et les comptes attendus ne sont pas
 * arrondis (c'est l'affichage qui arrondit). Une journée ou un compte qu'il faut atteindre s'arrondit à
 * l'unité supérieure. Un résultat négatif est une perte.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
/** Arrondi à l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);
const plancher = (x: number) => Math.floor(x + 1e-9);
/** Au centime supérieur : un prix plancher ne s'arrondit jamais vers le bas. */
const auCentimeSuperieur = (x: number) => plafond(x * 100) / 100 + 0;

const TRIMESTRES: readonly Trimestre[] = [1, 2, 3, 4];

export const clienteleDe = (f: FicheDuCabinet, code: CodeDeClientele) => {
  const c = f.clienteles.find((x) => x.code === code);
  if (!c) throw new Error(`Pas de clientèle ${code}`);
  return c;
};

export const commercialDe = (f: FicheDuCabinet, code: CodeDeCommercial): CommercialDuCabinet => {
  const c = f.commerciaux.find((x) => x.code === code);
  if (!c) throw new Error(`Pas de commercial ${code}`);
  return c;
};

export const canalDe = (f: FicheDuCabinet, code: CodeDeCanal): CanalDeConquete => {
  const c = f.canaux.find((x) => x.code === code);
  if (!c) throw new Error(`Pas de canal ${code}`);
  return c;
};

export const partenaireDe = (f: FicheDuCabinet, code: CodeDePartenaire) => {
  const p = f.partenaires.find((x) => x.code === code);
  if (!p) throw new Error(`Pas de partenaire ${code}`);
  return p;
};

/** Le coût variable d'une journée : les frais de mission et les supports. */
export const coutVariableDUneJournee = (f: FicheDuCabinet) => f.coutVariableDUneJournee.fraisDeMission + f.coutVariableDUneJournee.supports;

/** La capacité d'un trimestre, en journées : consultants × jours facturables. */
export const capaciteDuTrimestre = (f: FicheDuCabinet) => f.consultants.nombre * f.consultants.joursFacturablesParTrimestre;

/** Le coût journalier d'un consultant : son coût de l'année ÷ les jours qu'il peut facturer dans l'année. */
export const coutJournalierDUnConsultant = (f: FicheDuCabinet) => auCentime(f.consultants.coutAnnuel / (f.consultants.joursFacturablesParTrimestre * 4));

/** Les charges fixes de l'année, poste par poste, et leur total ; un trimestre en porte le quart. */
export function chargesFixesDeLAnnee(f: FicheDuCabinet) {
  const total = somme(Object.values(f.chargesFixes));
  return { ...f.chargesFixes, total, parTrimestre: auCentime(total / 4) };
}

/** L'année N du cabinet : journées, chiffre d'affaires, frais, marges et résultat, lus sur les comptes. */
export function anneeDuCabinet(f: FicheDuCabinet) {
  const journees = somme(f.comptes.map((c) => c.journees));
  const chiffreDAffaires = auCentime(somme(f.comptes.map((c) => c.chiffreDAffaires)));
  const frais = auCentime(somme(f.comptes.map((c) => c.frais)));
  const margeSurCoutVariable = auCentime(chiffreDAffaires - frais);
  const coutDesConsultants = auCentime(journees * coutJournalierDUnConsultant(f));
  const marge = auCentime(somme(f.comptes.map((c) => c.marge)));
  const chargesFixes = chargesFixesDeLAnnee(f).total;
  return {
    comptes: f.comptes.length,
    journees,
    chiffreDAffaires,
    prixMoyen: chiffreDAffaires / journees,
    frais,
    margeSurCoutVariable,
    tauxDeMargeSurCoutVariable: margeSurCoutVariable / chiffreDAffaires,
    coutDesConsultants,
    /** La marge sur coûts directs de tous les comptes. */
    marge,
    tauxDeMarge: marge / chiffreDAffaires,
    chargesFixes,
    resultat: auCentime(margeSurCoutVariable - chargesFixes),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. LE PRIX PLANCHER ET LA MARGE DE MANŒUVRE
// ═════════════════════════════════════════════════════════════════════════════

/** Les leviers du prix plancher : le prix catalogue, le coût variable d'une journée, les charges fixes et les journées de l'année. */
export interface LeviersDuPrix {
  prixCatalogue: number;
  coutVariable: number;
  chargesFixes: number;
  journees: number;
}

/**
 * Les deux planchers d'une journée. Le coût complet = coût variable + charges fixes ÷ journées vendues
 * (la part des fixes au centime) : c'est le plancher de tous les clients. Le coût variable est le
 * plancher d'une affaire en plus, sur une capacité qui resterait libre. La marge de manœuvre est
 * l'écart entre le prix catalogue et le coût complet ; la remise maximale la rapporte au prix
 * catalogue (exacte, puis au pourcentage entier qui garde le prix au-dessus du coût complet).
 */
export function prixPlancher(f: FicheDuCabinet, leviers: Partial<LeviersDuPrix> = {}) {
  const prixCatalogue = leviers.prixCatalogue ?? f.prixCatalogue;
  const coutVariable = leviers.coutVariable ?? coutVariableDUneJournee(f);
  const chargesFixes = leviers.chargesFixes ?? chargesFixesDeLAnnee(f).total;
  const journees = leviers.journees ?? anneeDuCabinet(f).journees;
  const partDesFixes = auCentime(chargesFixes / journees);
  const coutComplet = auCentime(coutVariable + partDesFixes);
  const margeDeManoeuvre = auCentime(prixCatalogue - coutComplet);
  return {
    prixCatalogue,
    coutVariable,
    chargesFixes,
    journees,
    partDesFixes,
    coutComplet,
    margeDeManoeuvre,
    remiseMaximale: margeDeManoeuvre / prixCatalogue,
    /** En pourcentage entier : la plus forte remise qui laisse le prix au moins au coût complet. */
    remiseMaximaleEntiere: plancher((margeDeManoeuvre / prixCatalogue) * 100),
    margeSurCoutVariable: auCentime(prixCatalogue - coutVariable),
    /** La remise qui ramènerait le prix au coût variable : celle d'une affaire en plus, au plus. */
    remiseMaximaleDUneAffaireEnPlus: (prixCatalogue - coutVariable) / prixCatalogue,
  };
}

/** Une remise demandée sur le prix catalogue : le prix remisé, et s'il couvre le coût complet. */
export function remiseDemandee(f: FicheDuCabinet, remise: number = f.affaire.remiseDemandee, leviers: Partial<LeviersDuPrix> = {}) {
  const p = prixPlancher(f, leviers);
  const prixRemise = auCentime(p.prixCatalogue * (1 - remise));
  return {
    remise,
    prixRemise,
    coutComplet: p.coutComplet,
    /** Le prix remisé couvre le coût complet : la remise ne fait pas perdre d'argent. */
    tient: prixRemise >= p.coutComplet,
    ecartAuCoutComplet: auCentime(prixRemise - p.coutComplet),
    coutDeLaRemiseParJournee: auCentime(p.prixCatalogue - prixRemise),
  };
}

/**
 * La contrepartie d'une remise : les journées qu'il faut vendre au prix remisé pour garder la marge
 * sur coût variable de l'affaire au prix catalogue (à la journée supérieure). La remise se paie en
 * volume ; sous le coût variable, aucun volume ne la paie (null).
 */
export function contrepartieDUneRemise(f: FicheDuCabinet, leviers: Partial<{ remise: number; journees: number; prixCatalogue: number; coutVariable: number }> = {}) {
  const remise = leviers.remise ?? f.affaire.remiseDemandee;
  const journees = leviers.journees ?? f.affaire.journees;
  const prixCatalogue = leviers.prixCatalogue ?? f.prixCatalogue;
  const coutVariable = leviers.coutVariable ?? coutVariableDUneJournee(f);
  const prixRemise = auCentime(prixCatalogue * (1 - remise));
  const margeSansRemise = auCentime(journees * (prixCatalogue - coutVariable));
  const margeParJourneeRemisee = auCentime(prixRemise - coutVariable);
  const journeesNecessaires = margeParJourneeRemisee > 0 ? plafond(margeSansRemise / margeParJourneeRemisee) : null;
  return {
    remise,
    journees,
    prixRemise,
    margeSansRemise,
    margeParJourneeRemisee,
    margeAvecRemise: auCentime(journees * margeParJourneeRemisee),
    journeesNecessaires,
    journeesEnPlus: journeesNecessaires === null ? null : journeesNecessaires - journees,
  };
}

/**
 * Une baisse de prix accordée à tous les clients, sur l'année. Chaque clientèle demande ses journées
 * de N × (1 + élasticité × (−baisse)), à la journée inférieure, et paie son prix moyen de N baissé
 * d'autant. La marge sur coût variable compare les deux années. La capacité de l'année n'est pas
 * imposée : `depasseLaCapacite` dit si les journées demandées tiendraient.
 */
export function baisseDePrixPourTous(f: FicheDuCabinet, baisse: number) {
  const cv = coutVariableDUneJournee(f);
  const clienteles = f.clienteles.map((k) => {
    const comptes = f.comptes.filter((c) => c.clientele === k.code);
    const journees = somme(comptes.map((c) => c.journees));
    const chiffreDAffaires = auCentime(somme(comptes.map((c) => c.chiffreDAffaires)));
    const journeesApres = Math.max(0, plancher(journees * (1 - k.elasticite * baisse)));
    const chiffreDAffairesApres = auCentime((chiffreDAffaires / journees) * (1 - baisse) * journeesApres);
    return {
      code: k.code,
      nom: k.nom,
      elasticite: k.elasticite,
      journees,
      journeesApres,
      chiffreDAffaires,
      chiffreDAffairesApres,
      marge: auCentime(chiffreDAffaires - journees * cv),
      margeApres: auCentime(chiffreDAffairesApres - journeesApres * cv),
    };
  });
  const total = (cle: "journees" | "journeesApres" | "chiffreDAffaires" | "chiffreDAffairesApres" | "marge" | "margeApres") => auCentime(somme(clienteles.map((k) => k[cle])));
  const journeesApres = total("journeesApres");
  return {
    baisse,
    clienteles,
    journees: total("journees"),
    journeesApres,
    chiffreDAffaires: total("chiffreDAffaires"),
    chiffreDAffairesApres: total("chiffreDAffairesApres"),
    marge: total("marge"),
    margeApres: total("margeApres"),
    depasseLaCapacite: journeesApres > capaciteDuTrimestre(f) * 4,
  };
}

/** Si le cabinet montait son prix : la part de la demande que chaque clientèle perdrait (−élasticité × hausse), et celle qui tient le mieux. */
export function clientelesFaceAUneHausse(f: FicheDuCabinet, hausse: number) {
  const clienteles = f.clienteles.map((k) => ({ code: k.code, nom: k.nom, elasticite: k.elasticite, perte: -k.elasticite * hausse }));
  const tenace = clienteles.reduce((a, b) => (b.perte < a.perte ? b : a));
  return { hausse, clienteles, tenace };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. LA CAPACITÉ ET L'AFFAIRE ACCEPTABLE
// ═════════════════════════════════════════════════════════════════════════════

/** Les journées de chaque trimestre de N : capacité, demandées, vendues, libres, refusées, occupation, service. */
export function trimestresDeLAnnee(f: FicheDuCabinet) {
  const capacite = capaciteDuTrimestre(f);
  return TRIMESTRES.map((t, i) => {
    const demandees = f.journeesDemandees[i]!;
    const vendues = f.journeesVendues[i]!;
    return { trimestre: t, capacite, demandees, vendues, libres: capacite - vendues, refusees: demandees - vendues, occupation: vendues / capacite, tauxDeService: vendues / demandees };
  });
}

/** Les jours libres d'un trimestre de N. */
export const joursLibres = (f: FicheDuCabinet, trimestre: Trimestre) => trimestresDeLAnnee(f)[trimestre - 1]!.libres;

/** Les leviers d'une affaire en plus : son prix, ses journées, les jours libres du trimestre, le prix des journées qu'elle prendrait à d'autres. */
export interface LeviersDeLAffaire {
  prix: number;
  journees: number;
  /** Les jours libres où la placer (par défaut, ceux du trimestre choisi). */
  joursLibres: number;
  trimestre: Trimestre;
  prixDesJourneesDeplacees: number;
}

/**
 * Une affaire en plus, à un prix sous le coût complet. Ses journées vont d'abord sur les jours libres ;
 * au-delà, elles prennent la place de journées vendues à d'autres clients (au prix des journées
 * déplacées), dont la marge sur coût variable est perdue. Gain = journées × (prix − coût variable) −
 * journées déplacées × (prix déplacé − coût variable). Le plancher de l'affaire est le prix qui annule
 * ce gain (au centime supérieur) : le coût variable si elle tient dans les jours libres, plus haut
 * sinon. Les jours libres nécessaires sont le moins de jours libres qui laisse le gain positif ou nul.
 */
export function affaireEnPlus(f: FicheDuCabinet, leviers: Partial<LeviersDeLAffaire> = {}) {
  const cv = coutVariableDUneJournee(f);
  const prix = leviers.prix ?? f.affaire.contreProposition.prix;
  const journees = leviers.journees ?? f.affaire.contreProposition.journees;
  const trimestre = leviers.trimestre ?? 4;
  const libres = leviers.joursLibres ?? joursLibres(f, trimestre);
  const prixDeplace = leviers.prixDesJourneesDeplacees ?? f.prixDesJourneesDeplacees;
  const deplacees = Math.max(0, journees - libres);
  const margeDeLAffaire = auCentime(journees * (prix - cv));
  const margePerdue = auCentime(deplacees * (prixDeplace - cv));
  const gain = auCentime(margeDeLAffaire - margePerdue);
  const deplaceesSupportables = margeDeLAffaire > 0 ? plancher(margeDeLAffaire / (prixDeplace - cv)) : 0;
  return {
    prix,
    journees,
    trimestre,
    joursLibres: libres,
    surJoursLibres: journees - deplacees,
    deplacees,
    margeParJournee: auCentime(prix - cv),
    margeDeLAffaire,
    margePerdue,
    gain,
    acceptable: gain >= 0 && prix >= cv,
    prixPlancher: auCentimeSuperieur(cv + (deplacees / journees) * (prixDeplace - cv)),
    joursLibresNecessaires: margeDeLAffaire > 0 ? Math.max(0, journees - deplaceesSupportables) : null,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA VALEUR D'UN CLIENT
// ═════════════════════════════════════════════════════════════════════════════

/** Le compte moyen de N : son chiffre d'affaires et sa marge sur coûts directs (le total ÷ les comptes). */
export function compteMoyen(f: FicheDuCabinet) {
  const a = anneeDuCabinet(f);
  return { comptes: a.comptes, chiffreDAffaires: auCentime(a.chiffreDAffaires / a.comptes), marge: auCentime(a.marge / a.comptes) };
}

/** Une année du portefeuille : les comptes gardés, l'attrition (perdus ÷ comptes au 1er janvier), la fidélisation. */
export function portefeuilleDeLAnnee(f: FicheDuCabinet, annee: "N-2" | "N-1" | "N" = "N") {
  const p = f.portefeuilleDesAnnees.find((x) => x.annee === annee);
  if (!p) throw new Error(`Pas d'année ${annee}`);
  const gardes = p.auPremierJanvier - p.perdus;
  const attrition = p.perdus / p.auPremierJanvier;
  return { ...p, gardes, actifs: gardes + p.nouveaux, attrition, fidelisation: 1 - attrition };
}

/** Les leviers de la valeur d'un client : sa marge annuelle, l'attrition, le taux d'actualisation. */
export interface LeviersDeLaValeur {
  marge: number;
  attrition: number;
  taux: number;
}

/**
 * La valeur vie client. Un compte présent au début d'une année rapporte sa marge cette année-là, et
 * reste l'année suivante avec la probabilité (1 − attrition). Sa durée de vie moyenne est 1 ÷
 * attrition. Valeur vie simple = marge × durée de vie = marge ÷ attrition. Valeur vie actualisée : la
 * marge de l'année t vaut marge × (1 − attrition)^(t − 1) ÷ (1 + taux)^t aujourd'hui, et la somme de
 * toutes les années vaut marge ÷ (attrition + taux).
 */
export function valeurVieClient(leviers: LeviersDeLaValeur) {
  const { marge, attrition, taux } = leviers;
  return {
    ...leviers,
    dureeDeVie: 1 / attrition,
    simple: auCentime(marge / attrition),
    actualisee: auCentime(marge / (attrition + taux)),
  };
}

/** Les leviers de la valeur d'un client de N, avec la fiche pour valeur de départ. */
export function leviersDeLaValeur(f: FicheDuCabinet): LeviersDeLaValeur {
  return { marge: compteMoyen(f).marge, attrition: portefeuilleDeLAnnee(f).attrition, taux: f.tauxDActualisation };
}

/** Les marges attendues d'un compte, année par année : la chance d'être encore client, la marge attendue, sa valeur actuelle, et les cumuls. */
export function margesAnneeParAnnee(leviers: LeviersDeLaValeur, annees = 10) {
  let cumul = 0;
  let cumulActualise = 0;
  return Array.from({ length: annees }, (_, i) => {
    const t = i + 1;
    const encoreClient = Math.pow(1 - leviers.attrition, t - 1);
    const attendue = auCentime(leviers.marge * encoreClient);
    const actualisee = auCentime(attendue / Math.pow(1 + leviers.taux, t));
    cumul = auCentime(cumul + attendue);
    cumulActualise = auCentime(cumulActualise + actualisee);
    return { annee: t, encoreClient, attendue, actualisee, cumul, cumulActualise };
  });
}

/** Le coût d'acquisition d'un compte de N : ce qu'ont coûté les canaux ÷ les comptes qu'ils ont gagnés. */
export function coutDAcquisition(f: FicheDuCabinet) {
  const cout = somme(f.canaux.map((c) => c.cout));
  const comptes = somme(f.canaux.map((c) => c.contrats));
  return { cout, comptes, cac: auCentime(cout / comptes) };
}

/** La valeur d'un client de N face à ce qu'il a coûté à gagner : les deux valeurs vie et leurs rapports au coût d'acquisition. */
export function valeurDUnClient(f: FicheDuCabinet, leviers: Partial<LeviersDeLaValeur & { cac: number }> = {}) {
  const l = { ...leviersDeLaValeur(f), ...leviers };
  const v = valeurVieClient(l);
  const cac = leviers.cac ?? coutDAcquisition(f).cac;
  return { ...v, cac, rapportSimple: v.simple / cac, rapportActualise: v.actualisee / cac };
}

/** Les leviers du portefeuille : les recrues de l'année, l'attrition, les journées d'un compte, la capacité de l'année. */
export interface LeviersDuPortefeuille {
  recrues: number;
  attrition: number;
  journeesParCompte: number;
  capacite: number;
}

/**
 * Le portefeuille d'équilibre : celui où les départs (attrition × portefeuille) égalent les recrues,
 * soit recrues ÷ attrition (non arrondi). Il demande portefeuille × journées d'un compte, face à la
 * capacité de l'année : l'occupation dit s'il tient.
 */
export function portefeuilleDEquilibre(f: FicheDuCabinet, leviers: Partial<LeviersDuPortefeuille> = {}) {
  const n = portefeuilleDeLAnnee(f);
  const a = anneeDuCabinet(f);
  const recrues = leviers.recrues ?? n.nouveaux;
  const attrition = leviers.attrition ?? n.attrition;
  const journeesParCompte = leviers.journeesParCompte ?? a.journees / a.comptes;
  const capacite = leviers.capacite ?? capaciteDuTrimestre(f) * 4;
  const equilibre = recrues / attrition;
  const journees = equilibre * journeesParCompte;
  return { recrues, attrition, journeesParCompte, capacite, equilibre, departsALEquilibre: equilibre * attrition, journees, occupation: journees / capacite, tient: journees <= capacite };
}

/** Recruter ou fidéliser, à effort égal : des recrues plus nombreuses d'une part, ou une attrition plus faible de la même part. */
export function recruterOuFideliser(f: FicheDuCabinet, effort = 0.25) {
  const base = portefeuilleDEquilibre(f);
  const recruter = portefeuilleDEquilibre(f, { recrues: base.recrues * (1 + effort) });
  const fideliser = portefeuilleDEquilibre(f, { attrition: base.attrition * (1 - effort) });
  return { effort, base, recruter, fideliser, meilleur: fideliser.equilibre > recruter.equilibre ? ("fideliser" as const) : ("recruter" as const) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. L'ENTONNOIR ET LE COÛT D'ACQUISITION
// ═════════════════════════════════════════════════════════════════════════════

/** Les taux d'un entonnoir : rendez-vous ÷ contacts, devis ÷ rendez-vous, contrats ÷ devis (la transformation des devis), contrats ÷ contacts. */
function tauxDeLEntonnoir(c: { contacts: number; rendezVous: number; devis: number; contrats: number }) {
  return {
    tauxDeRendezVous: c.rendezVous / c.contacts,
    tauxDeDevis: c.devis / c.rendezVous,
    tauxDeTransformationDesDevis: c.contrats / c.devis,
    tauxDeTransformationGlobal: c.contrats / c.contacts,
  };
}

/** L'entonnoir de chaque canal, ses taux et ses coûts (par contact, par rendez-vous, par devis, par compte), puis le total. */
export function entonnoir(f: FicheDuCabinet) {
  const canaux = f.canaux.map((c) => ({
    ...c,
    ...tauxDeLEntonnoir(c),
    coutParContact: auCentime(c.cout / c.contacts),
    coutParRendezVous: auCentime(c.cout / c.rendezVous),
    coutParDevis: auCentime(c.cout / c.devis),
    cac: auCentime(c.cout / c.contrats),
  }));
  const total = {
    contacts: somme(f.canaux.map((c) => c.contacts)),
    rendezVous: somme(f.canaux.map((c) => c.rendezVous)),
    devis: somme(f.canaux.map((c) => c.devis)),
    contrats: somme(f.canaux.map((c) => c.contrats)),
    cout: somme(f.canaux.map((c) => c.cout)),
  };
  return { canaux, total: { ...total, ...tauxDeLEntonnoir(total), cac: auCentime(total.cout / total.contrats) } };
}

/** Les contacts qu'amène un budget de campagne : interpolés entre deux paliers de la courbe, plats au-delà du dernier. */
export function contactsDeLaCampagne(f: FicheDuCabinet, budget: number) {
  const c = f.courbeDeLaCampagne;
  if (budget <= c[0]!.budget) return c[0]!.contacts;
  for (let i = 1; i < c.length; i++) {
    const a = c[i - 1]!;
    const b = c[i]!;
    if (budget <= b.budget) return a.contacts + ((budget - a.budget) / (b.budget - a.budget)) * (b.contacts - a.contacts);
  }
  return c.at(-1)!.contacts;
}

/** Les leviers de la campagne : son budget, la valeur d'un compte gagné, et le taux de transformation des devis. */
export interface LeviersDeLaCampagne {
  budget: number;
  /** Ce que vaut un compte gagné (par défaut, sa valeur vie simple). */
  valeurDUnCompte: number;
  tauxDeTransformationDesDevis: number;
}

/**
 * La campagne à un budget : les contacts de la courbe, puis l'entonnoir de la campagne de N (les taux
 * de rendez-vous et de devis, et le taux de transformation des devis en levier). Les comptes gagnés
 * sont des comptes attendus (non arrondis). Gain = comptes × valeur d'un compte − budget.
 */
export function campagne(f: FicheDuCabinet, leviers: Partial<LeviersDeLaCampagne> = {}) {
  const digital = canalDe(f, "digital");
  const t = tauxDeLEntonnoir(digital);
  const budget = leviers.budget ?? digital.cout;
  const valeurDUnCompte = leviers.valeurDUnCompte ?? valeurDUnClient(f).simple;
  const tauxDeTransformationDesDevis = leviers.tauxDeTransformationDesDevis ?? t.tauxDeTransformationDesDevis;
  const contacts = contactsDeLaCampagne(f, budget);
  const rendezVous = contacts * t.tauxDeRendezVous;
  const devis = rendezVous * t.tauxDeDevis;
  const comptes = devis * tauxDeTransformationDesDevis;
  return {
    budget,
    valeurDUnCompte,
    tauxDeTransformationDesDevis,
    contacts,
    rendezVous,
    devis,
    comptes,
    cacMoyen: comptes > 0 ? auCentime(budget / comptes) : null,
    valeurCreee: auCentime(comptes * valeurDUnCompte),
    gain: auCentime(comptes * valeurDUnCompte - budget),
  };
}

/** Le compte en plus : ce qu'apporte le passage d'un budget à un autre, et ce que coûte chaque compte de ce supplément. */
export function compteEnPlus(f: FicheDuCabinet, de: number, a: number, leviers: Partial<Omit<LeviersDeLaCampagne, "budget">> = {}) {
  const avant = campagne(f, { ...leviers, budget: de });
  const apres = campagne(f, { ...leviers, budget: a });
  const comptes = apres.comptes - avant.comptes;
  const budget = a - de;
  return { de: avant, a: apres, budget, comptes, cacMarginal: comptes > 0 ? auCentime(budget / comptes) : null, gain: auCentime(apres.gain - avant.gain) };
}

/** Les cinq paliers de la courbe, chacun avec ce qu'apporte le palier précédent à celui-ci. */
export function paliersDeLaCampagne(f: FicheDuCabinet, leviers: Partial<Omit<LeviersDeLaCampagne, "budget">> = {}) {
  return f.courbeDeLaCampagne.map((p, i) => {
    const c = campagne(f, { ...leviers, budget: p.budget });
    const precedent = f.courbeDeLaCampagne[i - 1];
    return { ...c, supplement: precedent ? compteEnPlus(f, precedent.budget, p.budget, leviers) : null };
  });
}

/**
 * Le meilleur budget : celui qui donne le plus grand gain, cherché de zéro au dernier palier par pas
 * réguliers. Au-delà, le dernier euro rapporte moins qu'il ne coûte. Sur une courbe interpolée, il
 * tombe sur un palier.
 */
export function meilleurBudget(f: FicheDuCabinet, leviers: Partial<Omit<LeviersDeLaCampagne, "budget">> = {}, pas = 1_000) {
  const max = f.courbeDeLaCampagne.at(-1)!.budget;
  let meilleur = campagne(f, { ...leviers, budget: 0 });
  for (let b = pas; b <= max + 1e-9; b += pas) {
    const c = campagne(f, { ...leviers, budget: b });
    if (c.gain > meilleur.gain + 1e-9) meilleur = c;
  }
  return meilleur;
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LES PARTENAIRES ET LA COMMISSION
// ═════════════════════════════════════════════════════════════════════════════

/** Les leviers d'un compte apporté par un partenaire. */
export interface LeviersDuPartenaire {
  commission: number;
  partQuiRevientEnDirect: number;
  /** Le chiffre d'affaires et la marge annuels du compte (par défaut, ceux du compte moyen de N). */
  chiffreDAffaires: number;
  marge: number;
  attrition: number;
  /** 0 : la valeur vie simple ; le taux du cabinet : la valeur vie actualisée. */
  taux: number;
  /** Le coût d'acquisition d'un compte gagné en propre (par défaut, celui de N). */
  cac: number;
}

function leviersDuPartenaire(f: FicheDuCabinet, code: CodeDePartenaire, leviers: Partial<LeviersDuPartenaire>): LeviersDuPartenaire {
  const p = partenaireDe(f, code);
  const m = compteMoyen(f);
  return {
    commission: p.commission,
    partQuiRevientEnDirect: p.partQuiRevientEnDirect,
    chiffreDAffaires: m.chiffreDAffaires,
    marge: m.marge,
    attrition: portefeuilleDeLAnnee(f).attrition,
    taux: 0,
    cac: coutDAcquisition(f).cac,
    ...leviers,
  };
}

/**
 * Ce que valent, sur leur vie, des sommes versées chaque année de présence du compte : une somme la
 * première année, une autre chacune des suivantes. Simple (taux 0) : premiere + suivantes × (1 −
 * attrition) ÷ attrition. Actualisée : premiere ÷ (1 + taux) + suivantes × (1 − attrition) ÷ ((1 +
 * taux) × (attrition + taux)).
 */
function surLaVie(premiere: number, suivantes: number, attrition: number, taux: number) {
  return premiere / (1 + taux) + (suivantes * (1 - attrition)) / ((1 + taux) * (attrition + taux));
}

/**
 * Un compte apporté par un partenaire face à un compte gagné en propre, à valeur vie égale. Le
 * partenaire prend sa commission sur le chiffre d'affaires de la première année, puis chaque année sur
 * les comptes qui ne sont pas revenus en direct : commission × chiffre d'affaires × (1 − part en
 * direct) par an. Le compte gagné en propre a coûté le coût d'acquisition, une fois, aujourd'hui.
 */
export function valeurVieAvecUnPartenaire(f: FicheDuCabinet, code: CodeDePartenaire = "plateforme", leviers: Partial<LeviersDuPartenaire> = {}) {
  const l = leviersDuPartenaire(f, code, leviers);
  const commissionPremiereAnnee = auCentime(l.commission * l.chiffreDAffaires);
  const commissionDesAnneesSuivantes = auCentime(commissionPremiereAnnee * (1 - l.partQuiRevientEnDirect));
  const valeurVie = auCentime(surLaVie(l.marge, l.marge, l.attrition, l.taux));
  const commissionsSurLaVie = auCentime(surLaVie(commissionPremiereAnnee, commissionDesAnneesSuivantes, l.attrition, l.taux));
  const avecLePartenaire = auCentime(valeurVie - commissionsSurLaVie);
  const enPropre = auCentime(valeurVie - l.cac);
  return {
    ...l,
    commissionPremiereAnnee,
    commissionDesAnneesSuivantes,
    valeurVie,
    commissionsSurLaVie,
    avecLePartenaire,
    enPropre,
    ecart: auCentime(avecLePartenaire - enPropre),
    meilleur: avecLePartenaire > enPropre ? ("partenaire" as const) : ("en-propre" as const),
  };
}

/**
 * La commission plafond : la plus forte qui laisse au compte apporté autant de valeur vie qu'au compte
 * gagné en propre, soit coût d'acquisition ÷ (chiffre d'affaires × (ce que vaut 1 € de commission par
 * an sur la vie du compte)). Exacte, puis au pourcentage entier inférieur. La plafond « à la première
 * année » (coût d'acquisition ÷ chiffre d'affaires) est celle qu'on trouve en oubliant que la
 * commission revient chaque année.
 */
export function commissionPlafond(f: FicheDuCabinet, code: CodeDePartenaire = "plateforme", leviers: Partial<LeviersDuPartenaire> = {}) {
  const l = leviersDuPartenaire(f, code, leviers);
  const facteur = surLaVie(1, 1 - l.partQuiRevientEnDirect, l.attrition, l.taux);
  const plafondExact = l.cac / (l.chiffreDAffaires * facteur);
  return { ...l, facteur, plafond: plafondExact, plafondEntier: plancher(plafondExact * 100), plafondALaPremiereAnnee: l.cac / l.chiffreDAffaires };
}

/**
 * La part des comptes revenus en direct qu'il faudrait pour qu'à sa commission, le partenaire vaille la
 * conquête en propre : exacte (bornée à 0 et 1), puis au pourcentage entier supérieur ; null si même
 * avec tous les comptes revenus en direct, la commission de la première année coûte plus que la
 * conquête.
 */
export function partEnDirectNecessaire(f: FicheDuCabinet, code: CodeDePartenaire = "plateforme", leviers: Partial<LeviersDuPartenaire> = {}) {
  const l = leviersDuPartenaire(f, code, leviers);
  const premiere = l.commission * l.chiffreDAffaires;
  // surLaVie(premiere, premiere × (1 − d)) = cac, résolu en d.
  const suite = (1 - l.attrition) / ((1 + l.taux) * (l.attrition + l.taux));
  const resteAPayer = l.cac - premiere / (1 + l.taux);
  if (resteAPayer < 0) return { ...l, part: null, partEntiere: null };
  const part = Math.min(1, Math.max(0, 1 - resteAPayer / (premiere * suite)));
  return { ...l, part, partEntiere: plafond(part * 100) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. LE PORTEFEUILLE ABC
// ═════════════════════════════════════════════════════════════════════════════

export type Classe = "A" | "B" | "C";
export type CritereABC = "chiffreDAffaires" | "marge";

/**
 * Le classement ABC sur un critère : les comptes triés du plus grand au plus petit (à égalité, dans
 * l'ordre du fichier), leur part, leur part cumulée (non arrondie) et leur classe. Le premier compte
 * est toujours en A ; un compte est en A tant que la part cumulée jusqu'à lui ne dépasse pas le seuil
 * A, en B tant qu'elle ne dépasse pas le seuil B, en C ensuite.
 */
export function classementABC(f: FicheDuCabinet, critere: CritereABC = "chiffreDAffaires", seuils: { a: number; b: number } = f.seuilsABC) {
  const tries = [...f.comptes].sort((x, y) => y[critere] - x[critere]);
  const total = somme(tries.map((c) => c[critere]));
  let cumule = 0;
  const comptes = tries.map((c, i) => {
    cumule += c[critere];
    const cumul = cumule / total;
    const classe: Classe = i === 0 || cumul <= seuils.a + 1e-12 ? "A" : cumul <= seuils.b + 1e-12 ? "B" : "C";
    return { ...c, rang: i + 1, valeur: c[critere], part: c[critere] / total, cumul, classe };
  });
  const de = (x: Classe) => comptes.filter((c) => c.classe === x);
  const classes = { A: de("A"), B: de("B"), C: de("C") };
  const partDe = (x: Classe) => ({
    comptes: classes[x].length,
    partDesComptes: classes[x].length / comptes.length,
    valeur: somme(classes[x].map((c) => c.valeur)),
    part: somme(classes[x].map((c) => c.valeur)) / total,
  });
  return { critere, total, comptes, classes, A: partDe("A"), B: partDe("B"), C: partDe("C") };
}

/** Les deux classements, et ce qui change : les comptes A par le chiffre d'affaires qui sortent de A par la marge, et ceux qui y entrent. */
export function abcParLeChiffreDAffairesEtParLaMarge(f: FicheDuCabinet) {
  const parCa = classementABC(f, "chiffreDAffaires");
  const parMarge = classementABC(f, "marge");
  const enA = (k: ReturnType<typeof classementABC>) => new Set(k.classes.A.map((c) => c.code));
  const aCa = enA(parCa);
  const aMarge = enA(parMarge);
  return {
    parCa,
    parMarge,
    sortentDeA: parCa.classes.A.filter((c) => !aMarge.has(c.code)),
    entrentEnA: parMarge.classes.A.filter((c) => !aCa.has(c.code)),
    rangs: f.comptes.map((c) => ({ code: c.code, nom: c.nom, parCa: parCa.comptes.find((x) => x.code === c.code)!.rang, parMarge: parMarge.comptes.find((x) => x.code === c.code)!.rang })),
  };
}

/** Chaque compte, son taux de marge et sa valeur vie simple (sa marge ÷ son attrition estimée). */
export function valeurVieDesComptes(f: FicheDuCabinet) {
  return f.comptes.map((c: CompteClient) => ({ code: c.code, nom: c.nom, marge: c.marge, tauxDeMarge: c.marge / c.chiffreDAffaires, attrition: c.attrition, valeurVie: auCentime(c.marge / c.attrition) }));
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. LE TABLEAU DE BORD COMMERCIAL
// ═════════════════════════════════════════════════════════════════════════════

/** Un voyant s'allume sous un plancher, ou au-dessus d'un plafond. */
export const voyantAllume = (s: SeuilDAlerte, valeur: number) => (s.sens === "plancher" ? valeur < s.seuil - 1e-12 : valeur > s.seuil + 1e-12);

/** Le coût d'un commercial pour un trimestre : son salaire chargé et ses frais. */
export const coutDUnCommercial = (c: CommercialDuCabinet) => c.salaireCharge + c.frais;

/** Les comptes d'un commercial, leur chiffre d'affaires, leur marge sur coûts directs et leur taux de marge. */
export function comptesDuCommercial(f: FicheDuCabinet, code: CodeDeCommercial) {
  const comptes = f.comptes.filter((c) => c.commercial === code);
  const chiffreDAffaires = auCentime(somme(comptes.map((c) => c.chiffreDAffaires)));
  const marge = auCentime(somme(comptes.map((c) => c.marge)));
  return { comptes, journees: somme(comptes.map((c) => c.journees)), chiffreDAffaires, marge, tauxDeMarge: marge / chiffreDAffaires };
}

/** Les leviers du seuil d'un commercial : son coût du trimestre, le taux de marge de ses affaires, une commission sur son chiffre d'affaires. */
export interface LeviersDuSeuilCommercial {
  cout: number;
  tauxDeMarge: number;
  tauxDeCommission: number;
}

/**
 * LE SEUIL DE RENTABILITÉ D'UN COMMERCIAL : le chiffre d'affaires dont la marge paie son coût. Seuil
 * du trimestre = coût du trimestre ÷ (taux de marge de ses comptes − taux de commission) ; l'année en
 * fait quatre. Le cabinet ne paie pas de commission (0) ; le levier montre ce qu'en changerait une.
 */
export function seuilDeRentabiliteDUnCommercial(f: FicheDuCabinet, code: CodeDeCommercial, leviers: Partial<LeviersDuSeuilCommercial> = {}) {
  const c = commercialDe(f, code);
  const cout = leviers.cout ?? coutDUnCommercial(c);
  const tauxDeMarge = leviers.tauxDeMarge ?? comptesDuCommercial(f, code).tauxDeMarge;
  const tauxDeCommission = leviers.tauxDeCommission ?? 0;
  const seuil = auCentime(cout / (tauxDeMarge - tauxDeCommission));
  return { code, cout, tauxDeMarge, tauxDeCommission, seuil, seuilDeLAnnee: auCentime(seuil * 4) };
}

/** Les leviers d'un trimestre d'un commercial : ses devis, son taux de transformation, son panier moyen. */
export interface LeviersDuTrimestreCommercial {
  devis: number;
  tauxDeTransformation: number;
  panier: number;
}

/**
 * Un trimestre de N d'un commercial et ses indicateurs : taux de transformation des devis (contrats ÷
 * devis), devis par rendez-vous, panier moyen (chiffre d'affaires ÷ contrats), réalisation de
 * l'objectif, évolution sur le même trimestre de N − 1, marge apportée (au taux de ses comptes),
 * résultat du commercial (marge − coût) et position face à son seuil. Avec des leviers, les contrats
 * valent devis × taux (non arrondis) et le chiffre d'affaires contrats × panier.
 */
export function trimestreDUnCommercial(f: FicheDuCabinet, code: CodeDeCommercial, trimestre: Trimestre, leviers: Partial<LeviersDuTrimestreCommercial> = {}) {
  const c = commercialDe(f, code);
  const t = c.n[trimestre - 1]!;
  const avant = c.nMoins1[trimestre - 1]!;
  const s = seuilDeRentabiliteDUnCommercial(f, code);
  const devis = leviers.devis ?? t.devis;
  const tauxDeTransformation = leviers.tauxDeTransformation ?? t.contrats / t.devis;
  const contrats = leviers.devis === undefined && leviers.tauxDeTransformation === undefined ? t.contrats : devis * tauxDeTransformation;
  const panier = leviers.panier ?? t.chiffreDAffaires / t.contrats;
  const chiffreDAffaires = Object.keys(leviers).length === 0 ? t.chiffreDAffaires : auCentime(contrats * panier);
  const marge = auCentime(chiffreDAffaires * s.tauxDeMarge);
  const valeurs: Record<CodeDIndicateurCommercial, number> = {
    realisationDeLObjectif: chiffreDAffaires / t.objectif,
    tauxDeTransformation: contrats / devis,
    evolutionSurNMoins1: chiffreDAffaires / avant.chiffreDAffaires - 1,
    seuilDeRentabilite: chiffreDAffaires / s.seuil,
  };
  const voyants = (Object.keys(f.seuilsDAlerte) as CodeDIndicateurCommercial[]).filter((k) => voyantAllume(f.seuilsDAlerte[k], valeurs[k]));
  return {
    code,
    trimestre,
    rendezVous: t.rendezVous,
    devis,
    contrats,
    chiffreDAffaires,
    journees: t.journees,
    objectif: t.objectif,
    devisParRendezVous: devis / t.rendezVous,
    tauxDeTransformation: contrats / devis,
    panier: chiffreDAffaires / contrats,
    realisationDeLObjectif: valeurs.realisationDeLObjectif,
    nMoins1: { ...avant, tauxDeTransformation: avant.contrats / avant.devis, panier: avant.chiffreDAffaires / avant.contrats },
    evolutionSurNMoins1: valeurs.evolutionSurNMoins1,
    seuil: s.seuil,
    marge,
    cout: s.cout,
    resultat: auCentime(marge - s.cout),
    sousLeSeuil: chiffreDAffaires < s.seuil,
    voyants,
  };
}

/**
 * Le tableau de bord commercial de N : chaque commercial, ses quatre trimestres et son année (le seuil
 * de l'année, la marge et le résultat), puis le cabinet trimestre par trimestre face à N − 1, et la
 * liste des voyants allumés.
 */
export function tableauDeBordCommercial(f: FicheDuCabinet) {
  const commerciaux = f.commerciaux.map((c) => {
    const trimestres = TRIMESTRES.map((t) => trimestreDUnCommercial(f, c.code, t));
    const s = seuilDeRentabiliteDUnCommercial(f, c.code);
    const chiffreDAffaires = auCentime(somme(trimestres.map((t) => t.chiffreDAffaires)));
    const chiffreDAffairesN1 = auCentime(somme(c.nMoins1.map((t) => t.chiffreDAffaires)));
    const devis = somme(trimestres.map((t) => t.devis));
    const contrats = somme(trimestres.map((t) => t.contrats));
    const marge = auCentime(chiffreDAffaires * s.tauxDeMarge);
    return {
      code: c.code,
      prenom: c.prenom,
      poste: c.poste,
      trimestres,
      chiffreDAffaires,
      chiffreDAffairesN1,
      evolutionSurNMoins1: chiffreDAffaires / chiffreDAffairesN1 - 1,
      objectif: somme(c.n.map((t) => t.objectif)),
      journees: somme(trimestres.map((t) => t.journees)),
      rendezVous: somme(trimestres.map((t) => t.rendezVous)),
      devis,
      contrats,
      tauxDeTransformation: contrats / devis,
      panier: chiffreDAffaires / contrats,
      tauxDeMarge: s.tauxDeMarge,
      cout: auCentime(s.cout * 4),
      seuilDeLAnnee: s.seuilDeLAnnee,
      marge,
      resultat: auCentime(marge - s.cout * 4),
    };
  });
  const cabinet = TRIMESTRES.map((t, i) => {
    const chiffreDAffaires = auCentime(somme(commerciaux.map((c) => c.trimestres[i]!.chiffreDAffaires)));
    const chiffreDAffairesN1 = auCentime(somme(f.commerciaux.map((c) => c.nMoins1[i]!.chiffreDAffaires)));
    return { trimestre: t, chiffreDAffaires, chiffreDAffairesN1, evolutionSurNMoins1: chiffreDAffaires / chiffreDAffairesN1 - 1, journees: somme(commerciaux.map((c) => c.trimestres[i]!.journees)) };
  });
  const chiffreDAffaires = auCentime(somme(cabinet.map((t) => t.chiffreDAffaires)));
  const chiffreDAffairesN1 = auCentime(somme(cabinet.map((t) => t.chiffreDAffairesN1)));
  return {
    commerciaux,
    cabinet,
    chiffreDAffaires,
    chiffreDAffairesN1,
    evolutionSurNMoins1: chiffreDAffaires / chiffreDAffairesN1 - 1,
    voyantsAllumes: commerciaux.flatMap((c) => c.trimestres.flatMap((t) => t.voyants.map((v) => ({ commercial: c.code, trimestre: t.trimestre, indicateur: v })))),
  };
}
