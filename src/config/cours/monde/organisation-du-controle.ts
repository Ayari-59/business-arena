import { auCentime } from "./amortissement";
import { coutReelDeLEnceinte, fixesDesCentres, quantitesDuSemestre } from "./centres-de-nova";
import { demandeAuPrix, repartitionPrimaire, tableauDeBord, trimestreDeDecision } from "./couts-et-budgets";
import { NOVA_CAPACITE, type FicheDeLaCapacite } from "./nova-capacite";
import { NOVA_GESTION, type CentrePrincipal, type CodeDeCentre, type FicheDeGestion } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LE CONTRÔLE DE GESTION DANS L'ORGANISATION DE NOVA (le chapitre « Le contrôle
 * de gestion dans l'organisation » et son cas ; DCG UE11 2025, § 1.1 et 1.2 ; BUT GEA).
 *
 * Le dirigeant de NOVA décide comment organiser le contrôle : quelles activités forment la chaîne de
 * valeur, quels centres de responsabilité, sur quel critère juger chacun, quelle performance suivre.
 * AUCUN CHIFFRE NOUVEAU SUR CE QUI S'EST PASSÉ : tout se relit dans les fiches.
 *   · nova-gestion.ts et couts-et-budgets.ts : les charges fixes de janvier, leurs clés et la
 *     répartition des centres d'analyse (le coût complet), la droite de demande du trimestre, la
 *     capacité de la ligne, le semestre et son tableau de bord (la part de marché, le résultat) ;
 *   · centres-de-nova.ts : les deux centres de responsabilité (l'atelier, le service commercial) et
 *     les charges fixes de chacun, celles du chapitre « Piloter un centre » ;
 *   · nova-capacite.ts : les 4 opérateurs, leur salaire, celui du marché et le seuil de démission.
 *
 * LES HYPOTHÈSES DU CHAPITRE, nommées ci-dessous : le rang de chaque centre d'analyse dans la chaîne
 * de valeur, le type de centre de responsabilité de chaque service, la grille de prix que le
 * responsable commercial peut choisir, et la part de marché que vise le dirigeant (le seuil du voyant
 * du tableau de bord). La garde tests/cours/le-controle-de-gestion-dans-l-organisation.test.ts refait
 * chaque chiffre à la main.
 *
 * CONVENTIONS : hors taxes ; les montants au centime ; un résultat négatif est une perte.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LA CHAÎNE DE VALEUR
// ─────────────────────────────────────────────────────────────────────────────

export type RangDansLaChaine = "principale" | "soutien";

/**
 * LA CHAÎNE DE VALEUR DE NOVA (hypothèse du cours, d'après M. Porter). Les 5 centres d'analyse du coût
 * complet sont 5 activités : l'approvisionnement (la logistique d'entrée), la production et la
 * distribution (la logistique de sortie et la vente) font l'enceinte que le client paie ; l'entretien
 * de la ligne et l'administration (la comptabilité, la paie, la direction) la rendent possible sans
 * que le client les voie : ce sont des activités de soutien, les centres auxiliaires du coût complet.
 */
export const CHAINE_DE_VALEUR: Readonly<Record<CodeDeCentre, { libelle: string; rang: RangDansLaChaine; pourquoi: string }>> = {
  approvisionnement: { libelle: "Approvisionnement : commander et recevoir les composants", rang: "principale", pourquoi: "la logistique d'entrée : sans composants, pas d'enceinte" },
  production: { libelle: "Production : monter et tester les enceintes", rang: "principale", pourquoi: "c'est là que l'enceinte prend la valeur que le client paie" },
  distribution: { libelle: "Distribution : vendre et expédier", rang: "principale", pourquoi: "la logistique de sortie et la vente : l'enceinte arrive chez le client" },
  entretien: { libelle: "Entretien de la ligne", rang: "soutien", pourquoi: "il sert la production, le client ne le voit pas : c'est un centre auxiliaire" },
  administration: { libelle: "Administration : comptabilité, paie, direction", rang: "soutien", pourquoi: "elle sert toutes les autres activités : c'est l'infrastructure de l'entreprise" },
};

/** Les charges fixes de janvier de chaque activité, avant que les centres auxiliaires ne se répartissent (la répartition primaire). */
export function chaineDeValeur(f: FicheDeGestion = NOVA_GESTION) {
  const primaire = repartitionPrimaire(f);
  const activites = (Object.keys(CHAINE_DE_VALEUR) as CodeDeCentre[]).map((code) => ({ code, ...CHAINE_DE_VALEUR[code], charges: primaire[code] }));
  const total = auCentime(activites.reduce((t, a) => t + a.charges, 0));
  const soutien = auCentime(activites.filter((a) => a.rang === "soutien").reduce((t, a) => t + a.charges, 0));
  return { activites, total, soutien, principales: auCentime(total - soutien), partDuSoutien: soutien / total };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LES CENTRES DE RESPONSABILITÉ
// ─────────────────────────────────────────────────────────────────────────────

export type TypeDeCentre = "couts" | "depenses-discretionnaires" | "chiffre-d-affaires" | "profit" | "investissement";

/** Ce que le responsable d'un service maîtrise : ses charges, ses produits, ses investissements, et si ses charges suivent un volume. */
export interface Maitrise {
  charges: boolean;
  produits: boolean;
  investissements: boolean;
  /** Ses charges suivent-elles une production qu'on peut mesurer (un atelier), ou sont-elles à la discrétion de la direction (un service administratif) ? */
  chargesLieesAuVolume: boolean;
}

/**
 * LE TYPE D'UN CENTRE se lit sur ce que son responsable maîtrise : l'investissement fait un centre
 * d'investissement ; les charges et les produits, un centre de profit ; les produits seuls, un centre
 * de chiffre d'affaires ; les charges seules, un centre de coûts, productif quand elles suivent un
 * volume, de dépenses discrétionnaires sinon.
 */
export function typeDuCentre(m: Maitrise): TypeDeCentre {
  if (m.investissements) return "investissement";
  if (m.produits && m.charges) return "profit";
  if (m.produits) return "chiffre-d-affaires";
  return m.chargesLieesAuVolume ? "couts" : "depenses-discretionnaires";
}

export const LIBELLES_DES_TYPES: Readonly<Record<TypeDeCentre, string>> = {
  couts: "centre de coûts",
  "depenses-discretionnaires": "centre de dépenses discrétionnaires",
  "chiffre-d-affaires": "centre de chiffre d'affaires",
  profit: "centre de profit",
  investissement: "centre d'investissement",
};

/** Le critère sur lequel chaque type de centre se juge. */
export const CRITERE_DU_TYPE: Readonly<Record<TypeDeCentre, string>> = {
  couts: "le coût d'une enceinte, face à son standard",
  "depenses-discretionnaires": "le respect de son budget et la qualité du service rendu",
  "chiffre-d-affaires": "le chiffre d'affaires",
  profit: "la marge qu'il dégage",
  investissement: "la rentabilité des capitaux engagés",
};

/**
 * LES SERVICES DE NOVA ET CE QUE CHACUN MAÎTRISE (hypothèse du cours) : le chef d'atelier engage les
 * consommations de la ligne, pas les prix ni les investissements ; l'administration engage ses
 * dépenses, sans production à mesurer ; la direction décide des investissements (la ligne, le banc de
 * mesure). Le service commercial fixe le prix et fait les ventes : le dirigeant hésite à lui confier
 * aussi la marge, ce que le chapitre étudie (`SERVICE_COMMERCIAL`).
 */
export const SERVICES_DE_NOVA: readonly { code: string; nom: string; responsable: string; maitrise: Maitrise }[] = [
  { code: "atelier", nom: "L'atelier", responsable: "le chef d'atelier", maitrise: { charges: true, produits: false, investissements: false, chargesLieesAuVolume: true } },
  { code: "administration", nom: "L'administration", responsable: "le dirigeant, qui la tient lui-même", maitrise: { charges: true, produits: false, investissements: false, chargesLieesAuVolume: false } },
  { code: "direction", nom: "La direction", responsable: "le dirigeant", maitrise: { charges: true, produits: true, investissements: true, chargesLieesAuVolume: false } },
];

/** Les deux façons de juger le service commercial : sur ses ventes seules, ou sur ses ventes et leur coût variable. */
export const SERVICE_COMMERCIAL: Readonly<Record<"chiffre-d-affaires" | "profit", Maitrise>> = {
  "chiffre-d-affaires": { charges: false, produits: true, investissements: false, chargesLieesAuVolume: false },
  profit: { charges: true, produits: true, investissements: false, chargesLieesAuVolume: false },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. LES CHARGES QUE LE CHEF D'ATELIER MAÎTRISE (le principe de contrôlabilité)
// ─────────────────────────────────────────────────────────────────────────────

/** Les centres d'analyse que l'atelier regroupe (centres-de-nova.ts). */
const CENTRES_DE_L_ATELIER: readonly CentrePrincipal[] = ["approvisionnement", "production"];

/**
 * LES CHARGES DE L'ATELIER EN JANVIER, nature par nature : ses consommations (les composants et les
 * autres coûts variables des enceintes du mois), sa part du loyer, de la paie et de l'usure de la ligne
 * (la répartition primaire de ses deux centres d'analyse), et ce que l'entretien et l'administration lui
 * cèdent (le reste de ses charges fixes, celles de `fixesDesCentres`). Le chef d'atelier maîtrise ses
 * consommations : il les engage enceinte par enceinte. Le reste est décidé ailleurs : le bail par la
 * direction, l'effectif et les salaires par la direction, la ligne par l'investissement, et la part des
 * services par des clés de répartition.
 */
export function chargesDeLAtelierParNature(f: FicheDeGestion = NOVA_GESTION, mois = 0) {
  const q = quantitesDuSemestre(f)[mois]!;
  const ch = f.moisDeReference.chargesFixes;
  const cles = f.centres.primaire;
  const part = (k: keyof typeof ch) => auCentime(CENTRES_DE_L_ATELIER.reduce((t, c) => t + ch[k] * cles[k][c], 0));
  const loyer = part("loyer");
  const personnel = part("personnel");
  const usure = part("amortissement");
  const fixes = fixesDesCentres(f).atelier;
  const lignes = [
    { code: "composants", libelle: "Composants consommés", montant: auCentime(q * f.moisDeReference.coutVariable.composants), maitrisable: true },
    { code: "autres", libelle: "Emballage, transport et énergie de la chaîne", montant: auCentime(q * f.moisDeReference.coutVariable.autres), maitrisable: true },
    { code: "loyer", libelle: "Part du loyer du local", montant: loyer, maitrisable: false },
    { code: "personnel", libelle: "Part de la paie des opérateurs", montant: personnel, maitrisable: false },
    { code: "usure", libelle: "Usure de la ligne de montage", montant: usure, maitrisable: false },
    { code: "services", libelle: "Part de l'entretien et de l'administration", montant: auCentime(fixes - loyer - personnel - usure), maitrisable: false },
  ] as const;
  const maitrisables = auCentime(lignes.filter((l) => l.maitrisable).reduce((t, l) => t + l.montant, 0));
  const total = auCentime(lignes.reduce((t, l) => t + l.montant, 0));
  return { quantite: q, lignes, maitrisables, nonMaitrisables: auCentime(total - maitrisables), total, fixes };
}

/**
 * LE COÛT D'UNE ENCEINTE À L'ATELIER, un mois donné : le coût réel (toutes ses charges ÷ les enceintes
 * du mois, celui de centres-de-nova.ts), la part maîtrisable (son coût variable, qui ne dépend pas du
 * volume) et la part de ses charges fixes, que le volume fait varier.
 */
export function coutDeLAtelierDuMois(f: FicheDeGestion = NOVA_GESTION, mois = 0) {
  const q = quantitesDuSemestre(f)[mois]!;
  const fixes = fixesDesCentres(f).atelier;
  const variable = auCentime(f.moisDeReference.coutVariable.composants + f.moisDeReference.coutVariable.autres);
  return { nom: f.semestre.mois[mois]!.nom, quantite: q, reel: coutReelDeLEnceinte(f, q), variable, fixesParEnceinte: auCentime(fixes / q) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LE CRITÈRE DU SERVICE COMMERCIAL : CE QU'IL FAIT FAIRE AU PRIX
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA GRILLE DES PRIX (hypothèse du cours) : le responsable commercial fixe le prix du trimestre à
 * l'euro, de 40 € à 70 €. Le chapitre « Décider » lit la même droite de demande.
 */
export const GRILLE_DES_PRIX = { min: 40, max: 70, pas: 1 } as const;

export type CritereDuCommercial = "chiffre-d-affaires" | "profit";

/**
 * LE TRIMESTRE AU PRIX p (le premier trimestre de la décision) : les clients demandent la droite de la
 * fiche, la ligne fabrique ce qui se vend, dans la limite de sa capacité, sans sous-traitance. Les
 * charges fixes du trimestre ne bougent pas. Le trimestre de décision du modèle le calcule.
 */
export function trimestreAuPrix(f: FicheDeGestion = NOVA_GESTION, prix: number = f.decision.prix) {
  const t = trimestreDeDecision(f, { prix, production: Math.min(demandeAuPrix(f, prix), f.decision.capacite), sousTraitance: 0 });
  return { prix, demande: t.demande, ventes: t.ventes, chiffreDAffaires: t.chiffreDAffaires, marge: t.marge, chargesFixes: t.chargesFixes, resultat: t.resultat };
}

const prixDeLaGrille = () => Array.from({ length: (GRILLE_DES_PRIX.max - GRILLE_DES_PRIX.min) / GRILLE_DES_PRIX.pas + 1 }, (_, i) => GRILLE_DES_PRIX.min + i * GRILLE_DES_PRIX.pas);

/** Ce sur quoi le responsable est jugé, au prix p : le chiffre d'affaires, ou la marge sur coût variable. */
export const critereAuPrix = (f: FicheDeGestion, critere: CritereDuCommercial, prix: number) => {
  const t = trimestreAuPrix(f, prix);
  return critere === "chiffre-d-affaires" ? t.chiffreDAffaires : t.marge;
};

/** Le prix de la grille que choisit un responsable qui veut le meilleur critère (le plus bas, à égalité). */
export function prixQueChoisit(f: FicheDeGestion = NOVA_GESTION, critere: CritereDuCommercial) {
  return prixDeLaGrille().reduce((m, p) => (critereAuPrix(f, critere, p) > critereAuPrix(f, critere, m) ? p : m));
}

/** Le prix de la grille qui donne à NOVA son meilleur résultat. */
export function meilleurPrixPourNova(f: FicheDeGestion = NOVA_GESTION) {
  return prixDeLaGrille().reduce((m, p) => (trimestreAuPrix(f, p).resultat > trimestreAuPrix(f, m).resultat ? p : m));
}

/** LE PRIX PLANCHER : le plus bas prix de la grille où la marge couvre les charges fixes du trimestre. */
export function prixPlancher(f: FicheDeGestion = NOVA_GESTION) {
  return prixDeLaGrille().find((p) => trimestreAuPrix(f, p).resultat >= 0) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LA PERFORMANCE : EFFICACITÉ, EFFICIENCE, DURABILITÉ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA PART DE MARCHÉ QUE VISE LE DIRIGEANT (hypothèse du cours) : celle du voyant du tableau de bord,
 * 25 %. L'efficacité se lit sur cet objectif : atteint ou non.
 */
export const PART_DE_MARCHE_VISEE = NOVA_GESTION.seuilsDAlerte.partDeMarche;

/**
 * La performance d'un mois du semestre : l'efficacité (la part de marché face à l'objectif) et
 * l'efficience (les charges fixes que porte chaque enceinte, au centime : moins il en faut, mieux les
 * moyens sont employés), et le résultat du tableau de bord.
 */
export function performanceDuMois(f: FicheDeGestion = NOVA_GESTION, mois = 0) {
  const m = tableauDeBord(f).mois[mois]!;
  return {
    nom: m.nom,
    quantite: m.quantite,
    partDeMarche: m.partDeMarche,
    objectifAtteint: m.partDeMarche >= PART_DE_MARCHE_VISEE,
    chargesFixesParEnceinte: auCentime(m.chargesFixes / m.quantite),
    resultat: m.resultat,
  };
}

/**
 * LA DURABILITÉ DE LA PERFORMANCE SOCIALE : le salaire des opérateurs rapporté à celui du marché, en N
 * et en N + 1, face au seuil de démission (nova-capacite.ts) ; le salaire qui garde le seuil en N + 1, et
 * ce qu'il coûterait de plus à NOVA chaque mois et chaque année, cotisations patronales comprises, face
 * au coût d'un seul recrutement.
 */
export function durabiliteDuSalaire(c: FicheDeLaCapacite = NOVA_CAPACITE) {
  const salaire = c.operateurs.salaireBrutMensuel;
  const marche = c.personnel.salaireDuMarche;
  const seuil = c.personnel.seuilDeDemission;
  const salaireAuSeuil = auCentime(marche.nPlus1 * seuil);
  const enPlusParMois = auCentime(Math.max(0, salaireAuSeuil - salaire) * c.operateurs.nombre * (1 + c.operateurs.tauxDesCotisationsPatronales));
  return {
    salaire,
    rapportN: salaire / marche.n,
    rapportNPlus1: salaire / marche.nPlus1,
    seuil,
    salaireAuSeuil,
    enPlusParMois,
    enPlusParAn: auCentime(12 * enPlusParMois),
    coutDUnRecrutement: c.personnel.coutDUnRecrutement,
    operateurs: c.operateurs.nombre,
    tauxPatronal: c.operateurs.tauxDesCotisationsPatronales,
  };
}
