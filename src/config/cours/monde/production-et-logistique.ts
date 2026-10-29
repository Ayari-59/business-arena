import { anneeDeProduction, coutEmployeurMensuel, coutMoyenDUnDefaut, coutsDeLaQualite, enceintesParOperateurEtParMois, machineDe, margeUnitaire, aleaDe } from "./capacite";
import { CAPACITES_DU_COURS, MOIS_PAR_TRIMESTRE, type FicheDeLaCapacite } from "./nova-capacite";
import { VENTES_A_CAMPUSTECH } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LA PRODUCTION ET LA LOGISTIQUE DE NOVA (le lot M5 : « produire », « produire
 * bien » et leur cas, au bac STMG management ; « organiser l'activité » et son cas, en seconde
 * management et gestion ; « le stock de sécurité », « ce que coûte une livraison », « le taux de
 * remplissage », « livrer à temps » et leurs cas, en seconde professionnelle GATL).
 *
 * NOVA fabrique des enceintes (voir l-escale.ts pour le principe du monde du cours : une simulation
 * figée, inspirée de l'arène, calculée par le cours). Ce fichier ne recopie aucun chiffre : il relit
 * les fiches qui existent déjà et n'ajoute que ce qui manquait pour lire la logistique.
 *   · nova-capacite.ts et capacite.ts : la ligne de 4 postes (7 000 enceintes par trimestre), les
 *     4 opérateurs (151,67 heures payées par mois chacun, dont 150 au montage, 0,25 heure par enceinte), leur coût (2 662,50 € par
 *     mois chacun), le recrutement (2 mois, 3 000 €), le cinquième poste du catalogue (1 750 enceintes
 *     de plus), la demande de N (4 778, 6 081, 5 810, 6 940) et celle de N + 1 (5 800, 7 400, 6 200,
 *     7 800), la marge de 21 € d'une enceinte, la qualité (la courbe de la prévention, le contrôle
 *     final, les défauts retouchés et revenus), la panne de la ligne (un cinquième de la capacité) ;
 *   · nova-gestion.ts : les 320 enceintes que CampusTech reçoit chaque mois, les 22 € de composants
 *     d'une enceinte.
 *
 * LES HYPOTHÈSES DU LOT sont les constantes ci-dessous, chacune nommée et commentée. Le transport des
 * enceintes est compté dans les 16 € d'« emballage, transport et énergie » de nova-gestion.ts : ce
 * fichier ne l'ajoute à aucun compte, il détaille seulement la tournée de CampusTech, pour la lire.
 *
 * CONVENTIONS. Tout est hors taxes. Une palette, un kit de composants, une enceinte se comptent à
 * l'unité supérieure quand on en a besoin (une palette entamée part entière). Un écart négatif est une
 * perte.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
/** À l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);

export const ficheDeNova = (c: { code: string }): FicheDeLaCapacite => {
  const f = CAPACITES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de fiche de capacité pour ${c.code}`);
  return f;
};

export const ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA = ["nova"] as const;

export const POURQUOI_LA_PRODUCTION_DE_NOVA =
  "ce chapitre suit la ligne de montage de NOVA, que le cours tient d'un bout à l'autre : ses postes, ses opérateurs, ses composants et ses livraisons.";

// ═════════════════════════════════════════════════════════════════════════════
// LES HYPOTHÈSES DU LOT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LA COMMANDE EXCEPTIONNELLE (hypothèse du cas « La commande exceptionnelle ») : une chaîne d'hôtels
 * demande 1 500 enceintes, à livrer au 3e trimestre de N, en plus des clients habituels.
 */
export const COMMANDE_EXCEPTIONNELLE = { enceintes: 1_500, trimestre: 3 } as const;

/** LA PALETTE (hypothèse du cours) : 48 enceintes en carton, 4 couches de 12. */
export const ENCEINTES_PAR_PALETTE = 48;

export interface Vehicule {
  code: "porteur" | "petit-porteur";
  nom: string;
  /** Les palettes qu'il emporte. */
  places: number;
  /** Ce que coûtent sa location et son chauffeur pour une journée de tournée, qu'il roule plein ou vide. */
  location: number;
  chauffeur: number;
}

/**
 * LES DEUX CAMIONS DU LOUEUR (hypothèses du cours) : NOVA n'a pas de camion ; elle loue, à la
 * journée et avec son chauffeur, un porteur de 12 palettes (190 € de location, 210 € de chauffeur)
 * ou un petit porteur de 8 palettes (150 € et 210 €).
 */
export const PORTEUR: Vehicule = { code: "porteur", nom: "Le porteur de 12 palettes", places: 12, location: 190, chauffeur: 210 };
export const PETIT_PORTEUR: Vehicule = { code: "petit-porteur", nom: "Le petit porteur de 8 palettes", places: 8, location: 150, chauffeur: 210 };
export const VEHICULES: readonly Vehicule[] = [PETIT_PORTEUR, PORTEUR];

/**
 * LA ROUTE DE CAMPUSTECH (hypothèses du cours) : 240 km aller et retour jusqu'à son entrepôt, et 0,45 €
 * de gazole et de péages par kilomètre.
 */
export const ROUTE_DE_CAMPUSTECH = { km: 240, gazoleEtPeagesParKm: 0.45 } as const;

/** LA MESSAGERIE (hypothèse du cours) : un transporteur prend chaque palette pour 85 €, livrée chez CampusTech. */
export const MESSAGERIE_PAR_PALETTE = 85;

/** LE GAZOLE QUI AUGMENTE (hypothèse du cas « Le gazole qui augmente ») : 0,60 € par kilomètre au lieu de 0,45 €. */
export const GAZOLE_APRES_LA_HAUSSE = 0.6;

/**
 * LE LOT DE LA BOURSE DE FRET (hypothèse du cas) : un fabricant voisin propose 5 palettes à livrer
 * près de CampusTech, à 35 € la palette, avec un détour de 30 km.
 */
export const LOT_DE_LA_BOURSE = { palettes: 5, prixParPalette: 35, detourKm: 30 } as const;

/** L'OBJECTIF DE REMPLISSAGE du chapitre « Le taux de remplissage » (hypothèse du cours) : un camion rempli aux trois quarts. */
export const REMPLISSAGE_VISE = 0.75;

/**
 * LES JOURS DE MONTAGE (hypothèse du cours) : la ligne monte 58 jours par trimestre (les jours ouvrés,
 * moins les jours fériés et la fermeture d'inventaire). Elle consomme ses kits de composants au même
 * rythme chaque jour du trimestre.
 */
export const JOURS_DE_MONTAGE_PAR_TRIMESTRE = 58;

/** LE DÉLAI DU FOURNISSEUR (hypothèse du cours) : Électro-Composants Lyon livre les kits 6 jours de montage après la commande. */
export const DELAI_DU_FOURNISSEUR = 6;

/** LE STOCK DE SÉCURITÉ (choix de NOVA, hypothèse du cours) : 3 jours de consommation gardés d'avance. */
export const JOURS_DE_SECURITE = 3;

/** LE STOCK DU SOIR (hypothèse du chapitre « Le stock de sécurité ») : le magasinier compte 860 kits. */
export const STOCK_DU_SOIR = 860;

/** LE RETARD REDOUTÉ (hypothèse du cours) : le fournisseur a déjà livré avec 2 jours de retard. */
export const RETARD_REDOUTE = 2;

/** LE COÛT DE STOCKAGE (hypothèse du cours) : une enceinte finie gardée un trimestre coûte 1,50 € (l'entrepôt loué et l'assurance). */
export const COUT_DE_STOCKAGE_PAR_TRIMESTRE = 1.5;

// ═════════════════════════════════════════════════════════════════════════════
// 1. PRODUIRE : LA CAPACITÉ, L'ÉQUIPE ET LA PRODUCTIVITÉ
// ═════════════════════════════════════════════════════════════════════════════

/** Ce qu'un poste de la ligne monte en un trimestre : celui du catalogue, le même que les quatre de la ligne (1 750). */
export const capaciteDUnPoste = (f: FicheDeLaCapacite) => machineDe(f, "poste-manuel").capaciteEnPlus;

/** Ce qu'un opérateur monte en un trimestre : 600 par mois, 1 800. */
export const enceintesParOperateur = (f: FicheDeLaCapacite) => enceintesParOperateurEtParMois(f) * MOIS_PAR_TRIMESTRE;

/** Ce que coûte un opérateur à NOVA sur une année : 12 mois de salaire et de cotisations (31 950 €). */
export const coutAnnuelDUnOperateur = (f: FicheDeLaCapacite) => auCentime(coutEmployeurMensuel(f) * 12);

/** Les heures payées d'un opérateur par trimestre, celles de la productivité : 151,67 × 3 = 455,01. */
export const heuresParTrimestre = (f: FicheDeLaCapacite) => auCentime(f.operateurs.heuresPayeesParMois * MOIS_PAR_TRIMESTRE);

/**
 * Une année de production avec un effectif et un nombre de postes : chaque trimestre, la capacité des
 * postes, celle de l'équipe, la plus petite des deux, la production (la demande, bornée par la
 * capacité). L'année N + 1 par défaut (la ligne y est entretenue au budget du plan : disponible à 100 %).
 */
export function anneeAvec(f: FicheDeLaCapacite, leviers: Partial<{ operateurs: number; postes: number; annee: "N" | "N+1" }> = {}) {
  const operateurs = leviers.operateurs ?? f.plan.operateurs;
  const postes = leviers.postes ?? f.ligne.postes;
  const equipe = operateurs * enceintesParOperateur(f);
  const a = anneeDeProduction(f, {
    annee: leviers.annee ?? "N+1",
    equipe: [equipe, equipe, equipe, equipe],
    capaciteEnPlus: (postes - f.ligne.postes) * capaciteDUnPoste(f),
  });
  const trimestres = a.trimestres.map((t) => ({ ...t, capacite: Math.min(t.capaciteOutil, t.capaciteEquipe) }));
  return { ...a, operateurs, postes, trimestres, capacite: somme(trimestres.map((t) => t.capacite)) };
}

/** Le chapitre « Produire » : l'année N + 1 de NOVA, sa capacité, son goulot, sa productivité, et une embauche. */
export function production(f: FicheDeLaCapacite) {
  const a = anneeAvec(f);
  const t = a.trimestres[0]!;
  const heures = auCentime(a.operateurs * heuresParTrimestre(f) * 4);
  const avec = anneeAvec(f, { operateurs: a.operateurs + 1 });
  const coutDeLEmbauche = auCentime(coutAnnuelDUnOperateur(f) + f.personnel.coutDUnRecrutement);
  const productionGagnee = avec.production - a.production;
  return {
    annee: a,
    capaciteOutil: t.capaciteOutil,
    capaciteEquipe: t.capaciteEquipe,
    goulot: t.capaciteOutil <= t.capaciteEquipe ? ("outil" as const) : ("equipe" as const),
    utilisation: (a.production / a.capacite) * 100,
    parOperateur: a.production / a.operateurs,
    heures,
    parHeure: a.production / heures,
    avec,
    productionGagnee,
    coutDeLEmbauche,
    ecartDeResultat: auCentime(productionGagnee * margeUnitaire(f) - coutDeLEmbauche),
  };
}

/** Ce qui reste de la marge de l'année une fois l'équipe payée, selon l'effectif. */
export function margeApresLEquipe(f: FicheDeLaCapacite, operateurs: number) {
  const a = anneeAvec(f, { operateurs });
  const marge = auCentime(a.production * margeUnitaire(f));
  const equipe = auCentime(operateurs * coutAnnuelDUnOperateur(f));
  return { operateurs, production: a.production, refusees: a.refusees, marge, equipe, reste: auCentime(marge - equipe) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. PRODUIRE BIEN : LES DÉFAUTS ET CE QU'ILS COÛTENT
// ═════════════════════════════════════════════════════════════════════════════

/** La qualité de l'année N + 1 à un budget de prévention : défauts, retouchés, revenus, leurs coûts, le résultat. */
export const qualiteAuBudget = (f: FicheDeLaCapacite, prevention: number = f.qualite.budgetActuel) => coutsDeLaQualite(f, { prevention });

/** Les défauts qu'il faut éviter pour payer un budget de prévention en plus : budget ÷ coût moyen d'un défaut, à l'unité supérieure. */
export const defautsPourPayer = (f: FicheDeLaCapacite, budget: number) => plafond(budget / coutMoyenDUnDefaut(f));

// ═════════════════════════════════════════════════════════════════════════════
// 3. ORGANISER L'ACTIVITÉ : LA CAPACITÉ DU TRIMESTRE ET CE QUI LA LIMITE
// ═════════════════════════════════════════════════════════════════════════════

export type Limite = "clients" | "equipe" | "outil";

/** Un trimestre de l'année N : la capacité des postes, de l'équipe, la demande, et ce qui a limité les ventes. */
export function trimestreDeN(f: FicheDeLaCapacite, trimestre: number = 1) {
  const a = anneeAvec(f, { annee: "N" });
  const t = a.trimestres[trimestre - 1]!;
  const limite: Limite = t.demande <= t.capacite ? "clients" : t.capaciteOutil <= t.capaciteEquipe ? "outil" : "equipe";
  return { ...t, occupation: (t.production / t.capaciteOutil) * 100, libre: t.capacite - t.production, limite };
}

/**
 * Une embauche décidée le 1er janvier : le remplaçant arrive après le délai de recrutement (2 mois),
 * le 1er mars. Il ne monte qu'un mois au 1er trimestre, trois au 2e.
 */
export function embaucheDuPremierJanvier(f: FicheDeLaCapacite) {
  const delai = f.personnel.delaiDeRecrutementEnMois;
  const moisAuPremier = MOIS_PAR_TRIMESTRE - delai;
  return { delai, moisAuPremier, enPlusAuPremier: moisAuPremier * enceintesParOperateurEtParMois(f), enPlusAuDeuxieme: enceintesParOperateur(f) };
}

/** Un trimestre de N + 1 avec des postes et des opérateurs : la capacité, et la demande qui reste refusée. */
export function trimestreAvecDesRessources(f: FicheDeLaCapacite, postes: number, operateurs: number, trimestre: number = 4) {
  const outil = postes * capaciteDUnPoste(f);
  const equipe = operateurs * enceintesParOperateur(f);
  const demande = f.anneeNPlus1.demande[trimestre - 1]!;
  const capacite = Math.min(outil, equipe);
  return { postes, operateurs, outil, equipe, capacite, demande, refusees: Math.max(0, demande - capacite) };
}

/** La commande exceptionnelle : ce que le trimestre laisse de libre, et ce que NOVA peut en livrer. */
export function commandeExceptionnelle(f: FicheDeLaCapacite) {
  const t = trimestreDeN(f, COMMANDE_EXCEPTIONNELLE.trimestre);
  const livrable = Math.min(COMMANDE_EXCEPTIONNELLE.enceintes, t.libre);
  return { ...COMMANDE_EXCEPTIONNELLE, t, livrable, manque: COMMANDE_EXCEPTIONNELLE.enceintes - livrable };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LE STOCK DE SÉCURITÉ ET LE POINT DE COMMANDE DES KITS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Les kits d'un trimestre de N + 1 : un kit de composants par enceinte montée, consommés au même
 * rythme sur les jours de montage (au kit supérieur) ; la consommation pendant le délai, le stock de
 * sécurité, le point de commande (les deux ensemble), ce que le stock de sécurité immobilise.
 */
export function kitsDuTrimestre(f: FicheDeLaCapacite, trimestre: number = 1, joursDeSecurite: number = JOURS_DE_SECURITE) {
  const montees = anneeAvec(f).trimestres[trimestre - 1]!.production;
  const parJour = plafond(montees / JOURS_DE_MONTAGE_PAR_TRIMESTRE);
  const pendantLeDelai = parJour * DELAI_DU_FOURNISSEUR;
  const securite = parJour * joursDeSecurite;
  return {
    trimestre,
    montees,
    parJour,
    pendantLeDelai,
    securite,
    pointDeCommande: pendantLeDelai + securite,
    immobilise: auCentime(securite * f.enceinte.coutVariable.composants),
  };
}

/** Le plus grand retard (en jours entiers) qu'un stock couvre au moment de commander : (stock − délai × par jour) ÷ par jour. */
export const retardCouvert = (stock: number, parJour: number) => Math.floor((stock - parJour * DELAI_DU_FOURNISSEUR) / parJour + 1e-9);

/** Un stock de sécurité face à un retard du fournisseur : les enceintes qu'il ne laisse pas monter, leur marge, ce qu'il immobilise. */
export function securiteFaceAuRetard(f: FicheDeLaCapacite, joursDeSecurite: number, retard: number = RETARD_REDOUTE) {
  const k = kitsDuTrimestre(f, 1, joursDeSecurite);
  const perdues = Math.max(0, retard - joursDeSecurite) * k.parJour;
  return { ...k, joursDeSecurite, retard, perdues, margePerdue: auCentime(perdues * margeUnitaire(f)) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LA TOURNÉE DE CAMPUSTECH : CE QU'ELLE COÛTE, ET COMMENT ELLE SE REMPLIT
// ═════════════════════════════════════════════════════════════════════════════

/** Les palettes de n enceintes : une palette entamée part entière. */
export const palettesPour = (enceintes: number) => plafond(enceintes / ENCEINTES_PAR_PALETTE);

/** Les enceintes que CampusTech reçoit chaque mois (celles de nova-gestion.ts). */
export const enceintesDuMois = () => VENTES_A_CAMPUSTECH[0];

/** Ce que coûte une tournée : la location, le chauffeur, le gazole et les péages de la route. */
export function coutDUneTournee(v: Vehicule = PORTEUR, leviers: Partial<{ km: number; parKm: number }> = {}) {
  const km = leviers.km ?? ROUTE_DE_CAMPUSTECH.km;
  const parKm = leviers.parKm ?? ROUTE_DE_CAMPUSTECH.gazoleEtPeagesParKm;
  const route = auCentime(km * parKm);
  return { location: v.location, chauffeur: v.chauffeur, journee: v.location + v.chauffeur, route, total: auCentime(v.location + v.chauffeur + route) };
}

/** La tournée du mois chez CampusTech, au porteur : les palettes, le remplissage, ce que coûtent une palette et une enceinte, face à la messagerie. */
export function tourneeDuMois(v: Vehicule = PORTEUR, parKm: number = ROUTE_DE_CAMPUSTECH.gazoleEtPeagesParKm) {
  const enceintes = enceintesDuMois();
  const palettes = palettesPour(enceintes);
  const cout = coutDUneTournee(v, { parKm });
  const messagerie = palettes * MESSAGERIE_PAR_PALETTE;
  return {
    enceintes,
    palettes,
    places: v.places,
    vides: v.places - palettes,
    remplissage: (palettes / v.places) * 100,
    cout,
    parPalette: auCentime(cout.total / palettes),
    parPalettePlein: auCentime(cout.total / v.places),
    parEnceinte: auCentime(cout.total / enceintes),
    messagerie,
    economie: auCentime(messagerie - cout.total),
  };
}

/** Le gazole par kilomètre au-delà duquel la tournée coûte plus que la messagerie, au centime inférieur. */
export function gazoleQuiAnnuleLaTournee() {
  const t = tourneeDuMois();
  return Math.floor(((t.messagerie - t.cout.journee) / ROUTE_DE_CAMPUSTECH.km) * 100 + 1e-9) / 100;
}

export type ModeDeLivraison = "messagerie" | "tournee";

/** Le mois de CampusTech livré en n fois, par la messagerie ou par des tournées au porteur. */
export function livraisonsDuMois(mode: ModeDeLivraison, fois: number) {
  const parLivraison = plafond(enceintesDuMois() / fois);
  const palettes = palettesPour(parLivraison);
  const cout = mode === "tournee" ? auCentime(fois * coutDUneTournee().total) : fois * palettes * MESSAGERIE_PAR_PALETTE;
  return { mode, fois, parLivraison, palettes, cout };
}

/** Un trimestre de livraisons chez CampusTech : n tournées avec un camion. Les palettes qui ne tiennent pas restent à quai. */
export function trimestreDeTournees(v: Vehicule, tournees: number) {
  const enceintes = enceintesDuMois() * MOIS_PAR_TRIMESTRE;
  const palettes = palettesPour(plafond(enceintes / tournees));
  const chargees = Math.min(palettes, v.places);
  const aQuai = (palettes - chargees) * tournees;
  return {
    vehicule: v,
    tournees,
    enceintes,
    palettesParTournee: palettes,
    aQuai,
    remplissage: (chargees / v.places) * 100,
    cout: auCentime(tournees * coutDUneTournee(v).total),
  };
}

/** Le lot de la bourse de fret dans la tournée du mois : ce qu'il rapporte, ce que coûte le détour, la place qu'il trouve. */
export function lotDeLaBourse() {
  const t = tourneeDuMois();
  const recette = LOT_DE_LA_BOURSE.palettes * LOT_DE_LA_BOURSE.prixParPalette;
  const detour = auCentime(LOT_DE_LA_BOURSE.detourKm * ROUTE_DE_CAMPUSTECH.gazoleEtPeagesParKm);
  const tient = LOT_DE_LA_BOURSE.palettes <= t.vides;
  const chargees = t.palettes + (tient ? LOT_DE_LA_BOURSE.palettes : 0);
  return { t, ...LOT_DE_LA_BOURSE, recette, detour, gain: auCentime(recette - detour), tient, remplissageAvec: (chargees / t.places) * 100 };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. LIVRER À TEMPS : LE TAUX DE SERVICE, LE STOCK D'AVANCE, LA PANNE
// ═════════════════════════════════════════════════════════════════════════════

/** L'année N + 1 servie : la demande, les enceintes livrées dans leur trimestre, les refusées, le taux de service. */
export function serviceDeLAnnee(f: FicheDeLaCapacite) {
  const a = anneeAvec(f);
  return { a, tauxDeService: (a.production / a.demande) * 100, refusees: a.refusees, margePerdue: a.margeRefusee };
}

/**
 * L'année N + 1 avec des enceintes montées d'avance au 1er et au 3e trimestre (dans la capacité
 * libre) : chaque trimestre, la ligne monte ce qui manque au stock pour servir la demande, plus
 * l'avance, sans dépasser sa capacité ; le stock de fin de trimestre coûte son stockage.
 */
export function anneeAvecDeLAvance(f: FicheDeLaCapacite, avance: readonly number[]) {
  const a = anneeAvec(f);
  const m = margeUnitaire(f);
  let stock = 0;
  const trimestres = a.trimestres.map((t, i) => {
    const capacite = t.capacite;
    const montees = Math.min(capacite, Math.max(0, t.demande - stock) + (avance[i] ?? 0));
    const servies = Math.min(t.demande, stock + montees);
    stock = stock + montees - servies;
    return { trimestre: t.trimestre, demande: t.demande, capacite, montees, servies, refusees: t.demande - servies, stock };
  });
  const servies = somme(trimestres.map((t) => t.servies));
  const refusees = somme(trimestres.map((t) => t.refusees));
  const enStock = somme(trimestres.map((t) => t.stock));
  const stockage = auCentime(enStock * COUT_DE_STOCKAGE_PAR_TRIMESTRE);
  return {
    trimestres,
    servies,
    refusees,
    tauxDeService: (servies / a.demande) * 100,
    margeGagnee: auCentime((servies - a.production) * m),
    stockage,
    gain: auCentime((servies - a.production) * m - stockage),
  };
}

/** La panne de la ligne au 1er trimestre de N + 1 : la capacité qui reste, les enceintes refusées, et la place libre au trimestre suivant. */
export function panneDuPremierTrimestre(f: FicheDeLaCapacite) {
  const panne = aleaDe(f, "panne");
  const a = anneeAvec(f);
  const t = a.trimestres[0]!;
  const reste = Math.floor(t.capacite * (1 - panne.perteDeCapacite) + 1e-9);
  const refusees = Math.max(0, t.demande - reste);
  const suivant = a.trimestres[1]!;
  return {
    panne,
    capacite: t.capacite,
    reste,
    demande: t.demande,
    refusees,
    margePerdue: auCentime(refusees * margeUnitaire(f)),
    cout: auCentime(refusees * margeUnitaire(f) + panne.dommages),
    libreAuSuivant: suivant.capacite - suivant.demande,
  };
}
