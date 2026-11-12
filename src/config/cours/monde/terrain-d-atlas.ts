import { arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import type { CodeDeCommercial, CompteClient, FicheDuCabinet } from "./atlas-conseil";
import { canalDe, classementABC, commercialDe, type Classe } from "./relation-client";

/**
 * LE MONDE DU COURS : LE TERRAIN D'ATLAS CONSEIL (le parcours BTS NDRC, bloc 1 « terrain »).
 *
 * Trois chapitres le lisent : « Le fichier : qualifier, segmenter, cibler », « Organiser le secteur :
 * visites, temps et tournées » et « L'évènement commercial : budget, bilan et suivi des contacts ». Ce
 * module ajoute à la fiche d'ATLAS CONSEIL (monde/atlas-conseil.ts) ce que ces chapitres demandent, sans
 * toucher un chiffre de la fiche : le marché du cabinet, son fichier de prospection, la taille de ses
 * comptes, leur récence et leurs commandes (le score RFM), le calendrier et les visites d'un commercial,
 * la carte de son secteur, les salons de N et les matinales clients. Chaque donnée nouvelle est une
 * constante nommée et commentée ; la garde tests/cours/terrain-d-atlas.test.ts la refait à la main, et
 * tests/cours/atlas-conseil.test.ts vérifie qu'elle retombe sur la fiche (les 32 comptes, les contacts
 * des canaux, les contrats des commerciaux, les 17 200 € des stands).
 *
 * CONVENTIONS : celles de monde/relation-client.ts. Les montants sont au centime ; les taux et les comptes
 * attendus ne sont pas arrondis ; un nombre de contacts, de devis ou de rendez-vous qu'il faut atteindre
 * s'arrondit à l'unité supérieure, marche après marche.
 */

const auCentime = arrondi2;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const plafond = (x: number) => Math.ceil(x - 1e-9);

// ═════════════════════════════════════════════════════════════════════════════
// 1. LE MARCHÉ ET LE FICHIER
// ═════════════════════════════════════════════════════════════════════════════

export type CodeDeSegment = "petites-pme" | "pme-moyennes" | "grands-comptes" | "public";

export interface SegmentDuMarche {
  code: CodeDeSegment;
  nom: string;
  /** Les entreprises (ou les organismes publics) du segment, dans la région du cabinet. */
  entreprises: number;
  /** La part d'entre elles qui achète du conseil ou de la formation à un cabinet dans l'année. */
  partQuiAchete: number;
  /** Les journées qu'achète, en moyenne, une entreprise qui achète. */
  journeesParAcheteur: number;
}

/**
 * LE MARCHÉ D'ATLAS CONSEIL (hypothèse du cours) : les entreprises et les organismes de sa région, en
 * quatre segments par la taille, et ce qu'ils achètent de journées de conseil et de formation dans
 * l'année. Les petites PME (10 à 49 salariés) sont nombreuses mais achètent peu (8 % d'entre elles,
 * 5 journées) ; les PME moyennes et les ETI (50 à 4 999 salariés) font le plus gros marché ; les grandes
 * entreprises sont peu nombreuses et achètent beaucoup ; le secteur public achète sur appel d'offres.
 * Les ordres de grandeur suivent ceux du marché de la formation des entreprises : la part qui achète
 * monte avec la taille.
 */
export const MARCHE_D_ATLAS: readonly SegmentDuMarche[] = [
  { code: "petites-pme", nom: "Petites PME (10 à 49 salariés)", entreprises: 3_900, partQuiAchete: 0.08, journeesParAcheteur: 5 },
  { code: "pme-moyennes", nom: "PME moyennes et ETI", entreprises: 1_300, partQuiAchete: 0.3, journeesParAcheteur: 30 },
  { code: "grands-comptes", nom: "Grandes entreprises", entreprises: 60, partQuiAchete: 0.7, journeesParAcheteur: 150 },
  { code: "public", nom: "Secteur public", entreprises: 220, partQuiAchete: 0.4, journeesParAcheteur: 40 },
];

/**
 * LA TAILLE DES COMPTES (hypothèse du cours). La fiche range les comptes en trois clientèles ; les « PME
 * et ETI » s'y partagent en petites PME et en PME moyennes et ETI. Ces 11 comptes ont 50 salariés ou
 * plus : les 4 gros comptes de Nadia et les 7 comptes gagnés en N par la prospection, les salons et la
 * campagne. Les 13 autres comptes de la clientèle sont des petites PME. Les grands comptes de la fiche
 * sont les grandes entreprises, et le secteur public garde son nom.
 */
export const PME_MOYENNES_ET_ETI: readonly string[] = ["kerval", "serenoa", "montbreme", "ducastel", "ardel", "morand", "pervenche", "quartzel", "sauvagine", "rouviere", "lumen"];

/** Le segment d'un compte de la fiche. */
export function segmentDuCompte(c: CompteClient): CodeDeSegment {
  if (c.clientele === "grands-comptes") return "grands-comptes";
  if (c.clientele === "public") return "public";
  return PME_MOYENNES_ET_ETI.includes(c.code) ? "pme-moyennes" : "petites-pme";
}

/**
 * LE FICHIER DE PROSPECTION DE N (hypothèse du cours), tel que le CRM du cabinet le garde au 31 décembre :
 * une ligne par contact amené par la prospection téléphonique (1 200), les salons (400) et la campagne
 * digitale (600), soit les contacts des trois canaux de la fiche. Les 4 entreprises présentées par
 * l'apporteur n'y sont pas : il les présente en personne. Sur ces lignes :
 *   - 200 sont des doublons (une entreprise venue par deux canaux) : il reste 2 000 contacts uniques ;
 *   - 300 contacts uniques sont incomplets (ni le nom du décideur, ni un moyen de le joindre) ;
 *   - 200 contacts complets sont hors cible (moins de 10 salariés, étudiants, concurrents) ;
 *   - 70 prospects se sont opposés à être recontactés (le droit d'opposition du RGPD) ;
 *   - 110 n'ont donné aucune nouvelle depuis plus de trois ans : la durée de conservation recommandée par
 *     la CNIL pour un prospect est dépassée, la ligne doit être supprimée.
 * Il reste 1 320 contacts utilisables, rangés par segment.
 */
export const FICHIER_DE_PROSPECTION = {
  lignesParCanal: { prospection: 1_200, salons: 400, digital: 600 },
  doublons: 200,
  incomplets: 300,
  horsCible: 200,
  opposes: 70,
  sansNouvellesDepuisTroisAns: 110,
  utilisablesParSegment: { "petites-pme": 620, "pme-moyennes": 480, "grands-comptes": 40, public: 180 } as Readonly<Record<CodeDeSegment, number>>,
} as const;

/**
 * LA DURÉE DE CONSERVATION D'UN PROSPECT, en années après son dernier contact : celle que recommande la
 * CNIL (référentiel de la gestion commerciale). Au-delà, sans nouvelle de lui, la ligne se supprime.
 */
export const DUREE_DE_CONSERVATION_D_UN_PROSPECT = 3; // À VÉRIFIER (recommandation CNIL : 3 ans après le dernier contact émanant du prospect)

/** Un segment de l'entonnoir de N : les contacts du fichier et ce qu'ils sont devenus. */
export interface EntonnoirDuSegment {
  contacts: number;
  rendezVous: number;
  devis: number;
  contrats: number;
}

/**
 * L'ENTONNOIR DE N PAR SEGMENT (hypothèse du cours) : les 2 200 lignes du fichier, de la prospection, des
 * salons et de la campagne, rangées par la taille de l'entreprise. Ensemble, elles refont les 150
 * rendez-vous, les 33 devis et les 7 contrats de ces trois canaux. Les 7 contrats sont les 7 PME moyennes
 * gagnées en N ; les petites PME ont demandé des devis, mais aucun n'a été signé (leurs budgets sont trop
 * petits pour une mission) ; les grandes entreprises et le public reçoivent peu de commerciaux.
 */
export const ENTONNOIR_PAR_SEGMENT: Readonly<Record<CodeDeSegment, EntonnoirDuSegment>> = {
  "petites-pme": { contacts: 1_000, rendezVous: 50, devis: 10, contrats: 0 },
  "pme-moyennes": { contacts: 800, rendezVous: 80, devis: 20, contrats: 7 },
  "grands-comptes": { contacts: 60, rendezVous: 6, devis: 1, contrats: 0 },
  public: { contacts: 340, rendezVous: 14, devis: 2, contrats: 0 },
};

/** L'OBJECTIF DE CONQUÊTE DU CABINET : les 8 comptes qu'il gagne chaque année depuis N − 2 (la fiche), à tenir en N + 1. */
export const OBJECTIF_DE_COMPTES_NEUFS = 8;

/** Le marché d'ATLAS, segment par segment : ce qu'il achète, ce qu'en prend le cabinet, ce que laisse un compte. */
export function marcheDAtlas(f: FicheDuCabinet) {
  const segments = MARCHE_D_ATLAS.map((s) => {
    const comptes = f.comptes.filter((c) => segmentDuCompte(c) === s.code);
    const acheteurs = s.entreprises * s.partQuiAchete;
    const journeesDuMarche = acheteurs * s.journeesParAcheteur;
    const journees = somme(comptes.map((c) => c.journees));
    const marge = auCentime(somme(comptes.map((c) => c.marge)));
    return {
      ...s,
      acheteurs,
      journeesDuMarche,
      comptes: comptes.length,
      journees,
      chiffreDAffaires: auCentime(somme(comptes.map((c) => c.chiffreDAffaires))),
      marge,
      partDeMarche: journees / journeesDuMarche,
      penetration: comptes.length / s.entreprises,
      journeesRestantes: journeesDuMarche - journees,
      margeParCompte: auCentime(marge / comptes.length),
      margeParJournee: auCentime(marge / journees),
    };
  });
  const de = (code: CodeDeSegment) => segments.find((s) => s.code === code)!;
  return { segments, de, journeesDuMarche: somme(segments.map((s) => s.journeesDuMarche)) };
}

/** Ce que vaut un compte d'un groupe : sa marge moyenne ÷ son attrition moyenne (la valeur vie simple). */
export function valeurVieDUnGroupe(comptes: readonly CompteClient[]) {
  const marge = auCentime(somme(comptes.map((c) => c.marge)) / comptes.length);
  const attrition = somme(comptes.map((c) => c.attrition)) / comptes.length;
  return { comptes: comptes.length, marge, attrition, valeurVie: auCentime(marge / attrition) };
}

/** Les comptes neufs de N qu'un segment a donnés (ancienneté 0, venus par un canal du fichier). */
export const comptesNeufsDuSegment = (f: FicheDuCabinet, code: CodeDeSegment) =>
  f.comptes.filter((c) => c.anciennete === 0 && c.origine !== null && c.origine !== "apporteurs" && segmentDuCompte(c) === code);

/** Les leviers de la qualité du fichier : ce qu'on retire à chaque tri. */
export type LeviersDuFichier = Omit<typeof FICHIER_DE_PROSPECTION, "lignesParCanal" | "utilisablesParSegment">;

/** La qualité du fichier : les lignes, les contacts uniques, la complétude, les contacts qualifiés, puis utilisables. */
export function qualiteDuFichier(leviers: Partial<LeviersDuFichier> = {}) {
  const l = { ...FICHIER_DE_PROSPECTION, ...leviers };
  const lignes = somme(Object.values(FICHIER_DE_PROSPECTION.lignesParCanal));
  const uniques = lignes - l.doublons;
  const complets = uniques - l.incomplets;
  const qualifies = complets - l.horsCible;
  const utilisables = qualifies - l.opposes - l.sansNouvellesDepuisTroisAns;
  return {
    lignes,
    doublons: l.doublons,
    uniques,
    complets,
    tauxDeCompletude: complets / uniques,
    qualifies,
    retiresParLeRgpd: l.opposes + l.sansNouvellesDepuisTroisAns,
    utilisables,
    partUtilisable: utilisables / lignes,
  };
}

/** Les taux de l'entonnoir d'un segment. */
export function tauxDuSegment(code: CodeDeSegment) {
  const e = ENTONNOIR_PAR_SEGMENT[code];
  return {
    ...e,
    tauxDeRendezVous: e.rendezVous / e.contacts,
    devisParRendezVous: e.devis / e.rendezVous,
    tauxDeSignature: e.contrats / e.devis,
    comptesParContact: e.contrats / e.contacts,
  };
}

/** Les leviers du calcul à rebours : les comptes visés, et les taux de chaque marche. */
export interface LeviersARebours {
  comptes: number;
  tauxDeRendezVous: number;
  devisParRendezVous: number;
  tauxDeSignature: number;
}

/**
 * À REBOURS : les devis, les rendez-vous, puis les contacts qualifiés qu'il faut pour gagner un nombre de
 * comptes, chaque marche arrondie à l'unité supérieure (on ne remet pas 22,86 devis). Par défaut, l'objectif
 * de 8 comptes, aux taux des PME moyennes de N ; face aux contacts utilisables du segment dans le fichier.
 */
export function aRebours(leviers: Partial<LeviersARebours> = {}, segment: CodeDeSegment = "pme-moyennes") {
  const t = tauxDuSegment(segment);
  const l: LeviersARebours = { comptes: OBJECTIF_DE_COMPTES_NEUFS, tauxDeRendezVous: t.tauxDeRendezVous, devisParRendezVous: t.devisParRendezVous, tauxDeSignature: t.tauxDeSignature, ...leviers };
  const devis = plafond(l.comptes / l.tauxDeSignature);
  const rendezVous = plafond(devis / l.devisParRendezVous);
  const contacts = plafond(rendezVous / l.tauxDeRendezVous);
  const utilisables = FICHIER_DE_PROSPECTION.utilisablesParSegment[segment];
  return { ...l, segment, devis, rendezVous, contacts, utilisables, manquants: Math.max(0, contacts - utilisables), suffit: contacts <= utilisables };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. LE SCORE RFM
// ═════════════════════════════════════════════════════════════════════════════

/** La récence et la fréquence d'un compte. */
export interface RecenceEtFrequence {
  /** Les mois entre sa dernière mission et le 31 décembre N (0 : une mission en décembre). */
  recence: number;
  /** Les missions qu'il a commandées dans l'année N : les contrats que son commercial a signés avec lui. */
  commandes: number;
}

/**
 * LA RÉCENCE ET LES COMMANDES DES 32 COMPTES EN N (hypothèse du cours). Les commandes d'un commercial
 * refont ses contrats de N, ceux du tableau de bord : 29 pour Marc, 47 pour Nadia, 13 pour Hugo. Les
 * gros comptes commandent chaque mois ou presque ; les petits comptes, une ou deux fois, et parfois au
 * printemps seulement : ils sont ceux que la fiche dit le plus en risque.
 */
export const RECENCE_ET_COMMANDES: Readonly<Record<string, RecenceEtFrequence>> = {
  queric: { recence: 7, commandes: 1 },
  arveon: { recence: 0, commandes: 9 },
  corvane: { recence: 10, commandes: 1 },
  ferrand: { recence: 1, commandes: 2 },
  bastide: { recence: 0, commandes: 7 },
  malvine: { recence: 5, commandes: 2 },
  blanchet: { recence: 9, commandes: 1 },
  vauclair: { recence: 4, commandes: 2 },
  ardel: { recence: 1, commandes: 3 },
  "saint-erbin": { recence: 11, commandes: 1 },
  valbrune: { recence: 2, commandes: 3 },
  dubreuil: { recence: 8, commandes: 1 },
  verdasse: { recence: 6, commandes: 1 },
  morand: { recence: 2, commandes: 2 },
  roudier: { recence: 5, commandes: 2 },
  helianthe: { recence: 1, commandes: 2 },
  pervenche: { recence: 3, commandes: 3 },
  garance: { recence: 4, commandes: 3 },
  kerval: { recence: 1, commandes: 5 },
  serenoa: { recence: 0, commandes: 6 },
  montbreme: { recence: 1, commandes: 6 },
  quartzel: { recence: 2, commandes: 3 },
  maelle: { recence: 10, commandes: 1 },
  rouviere: { recence: 3, commandes: 2 },
  granvaux: { recence: 1, commandes: 4 },
  lorvan: { recence: 6, commandes: 2 },
  sauvagine: { recence: 1, commandes: 2 },
  ostrea: { recence: 7, commandes: 2 },
  ambrette: { recence: 8, commandes: 1 },
  morvelle: { recence: 5, commandes: 1 },
  ducastel: { recence: 0, commandes: 7 },
  lumen: { recence: 4, commandes: 1 },
};

/**
 * LES SEUILS DU SCORE RFM (hypothèse du cours, une grille à trois notes comme celles des manuels) : chaque
 * critère vaut 3, 2 ou 1. Récence : 3 jusqu'à 2 mois, 2 jusqu'à 6 mois, 1 au-delà. Fréquence : 3 à partir
 * de 5 commandes, 2 à partir de 2, 1 pour une seule. Montant : 3 à partir de 50 000 €, 2 à partir de
 * 10 000 €, 1 en dessous. Le score est la somme des trois notes, de 3 à 9.
 */
export const SEUILS_RFM = {
  recence: { trois: 2, deux: 6 },
  frequence: { trois: 5, deux: 2 },
  montant: { trois: 50_000, deux: 10_000 },
} as const;

export type GroupeRFM = "fideles" | "a-developper" | "a-reveiller" | "en-sommeil";

/** LES QUATRE GROUPES DU SCORE (hypothèse du cours) : 8 et 9, les fidèles ; 6 et 7, à développer ; 4 et 5, à réveiller ; 3, en sommeil. */
export const GROUPES_RFM: readonly { code: GroupeRFM; nom: string; scoreMin: number }[] = [
  { code: "fideles", nom: "Fidèles", scoreMin: 8 },
  { code: "a-developper", nom: "À développer", scoreMin: 6 },
  { code: "a-reveiller", nom: "À réveiller", scoreMin: 4 },
  { code: "en-sommeil", nom: "En sommeil", scoreMin: 3 },
];

const noteDe = (valeur: number, trois: number, deux: number, sens: "petit" | "grand") =>
  sens === "petit" ? (valeur <= trois ? 3 : valeur <= deux ? 2 : 1) : valeur >= trois ? 3 : valeur >= deux ? 2 : 1;

/** Le groupe d'un score. */
export const groupeDuScore = (score: number) => GROUPES_RFM.find((g) => score >= g.scoreMin)!;

/** Le score RFM de chaque compte, dans l'ordre du fichier, sa classe ABC par le chiffre d'affaires, et les comptes de chaque groupe. */
export function scoreRFM(f: FicheDuCabinet) {
  const abc = classementABC(f, "chiffreDAffaires");
  const comptes = f.comptes.map((c) => {
    const rf = RECENCE_ET_COMMANDES[c.code]!;
    const r = noteDe(rf.recence, SEUILS_RFM.recence.trois, SEUILS_RFM.recence.deux, "petit");
    const fr = noteDe(rf.commandes, SEUILS_RFM.frequence.trois, SEUILS_RFM.frequence.deux, "grand");
    const m = noteDe(c.chiffreDAffaires, SEUILS_RFM.montant.trois, SEUILS_RFM.montant.deux, "grand");
    const score = r + fr + m;
    return { ...c, ...rf, r, f: fr, m, score, groupe: groupeDuScore(score).code, classe: abc.comptes.find((x) => x.code === c.code)!.classe as Classe };
  });
  const groupes = GROUPES_RFM.map((g) => ({ ...g, comptes: comptes.filter((c) => c.groupe === g.code) }));
  return { comptes, groupes, de: (code: string) => comptes.find((c) => c.code === code)! };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LE SECTEUR, LES VISITES ET LES TOURNÉES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE CALENDRIER D'UN COMMERCIAL EN N + 1 (hypothèse du cours) : 365 jours, 104 de week-end, 25 de congés
 * payés (cinq semaines), 8 jours fériés tombant en semaine. Des jours ouvrés, il passe 5 jours en
 * formation et en séminaire, 44 au bureau (les devis, les réunions, le CRM, environ un jour par semaine)
 * et 4 sur les stands des salons. Le reste est le terrain.
 */
export const CALENDRIER_DU_COMMERCIAL = { jours: 365, weekEnds: 104, congesPayes: 25, feriesEnSemaine: 8, formation: 5, bureau: 44, salons: 4 } as const;

/** LES VISITES D'UN JOUR DE TERRAIN (hypothèse du cours) : 2 en moyenne, sur un secteur régional où l'on roule entre deux visites. */
export const VISITES_PAR_JOUR_DE_TERRAIN = 2;

/**
 * LA FRÉQUENCE DE VISITE PAR CLASSE ABC (hypothèse du cours, la règle du cabinet en N) : un compte A est
 * vu chaque mois, un compte B tous les deux mois, un compte C chaque trimestre. Ce sont les visites de
 * suivi, en plus des rendez-vous d'affaires du tableau de bord, qui mènent aux devis.
 */
export const FREQUENCE_DE_VISITE: Readonly<Record<Classe, number>> = { A: 12, B: 6, C: 4 };

/** LA VISITE À DISTANCE (hypothèse du cours) : une visioconférence d'une heure prend le quart du temps d'une visite sur place, et ne coûte aucun frais de route. */
export const VISITE_A_DISTANCE = { partDuTemps: 0.25 } as const;

/**
 * LES PROSPECTS À RENCONTRER EN N + 1 (hypothèse du cours) : la direction veut que Nadia, la commerciale
 * des entreprises, voie en visite 60 PME moyennes du fichier qualifié, en plus de ses clients.
 */
export const PROSPECTS_A_VOIR = 60;

/** Un point de la carte du secteur : le bureau, ou un compte de la fiche. */
export interface PointDuSecteur {
  code: string;
  nom: string;
}

/**
 * LA CARTE DU SUD DU SECTEUR DE NADIA (hypothèse du cours) : le bureau du cabinet, à Granvaux, et trois
 * petits comptes qu'elle voit chaque trimestre, l'Imprimerie Garance, la Biscuiterie Malvine et les
 * Pépinières Lorvan. Les distances sont en kilomètres, par la route, dans les deux sens.
 */
export const CARTE_DU_SECTEUR = {
  points: [
    { code: "bureau", nom: "Le bureau de Granvaux" },
    { code: "garance", nom: "Imprimerie Garance" },
    { code: "malvine", nom: "Biscuiterie Malvine" },
    { code: "lorvan", nom: "Pépinières Lorvan" },
  ] as readonly PointDuSecteur[],
  distances: { "bureau-garance": 30, "bureau-malvine": 55, "bureau-lorvan": 40, "garance-malvine": 35, "garance-lorvan": 45, "lorvan-malvine": 25 } as Readonly<Record<string, number>>,
  /** L'ordre de l'agenda de Nadia : les comptes dans l'ordre où ils ont pris rendez-vous. */
  agenda: ["garance", "lorvan", "malvine"] as readonly string[],
} as const;

/**
 * LA ROUTE (hypothèses du cours) : 50 km/h de moyenne sur les routes du secteur ; 0,45 € par kilomètre
 * pour la voiture du cabinet (carburant, entretien, usure), une part des frais du commercial de la fiche.
 * Une visite dure une heure sur place.
 */
export const ROUTE = { vitesse: 50, coutDuKilometre: 0.45, heuresParVisite: 1 } as const;

/** Les jours de terrain d'un commercial, et ce qu'ils permettent de visites. */
export function joursDeTerrain(leviers: Partial<{ visitesParJour: number }> = {}) {
  const k = CALENDRIER_DU_COMMERCIAL;
  const ouvres = k.jours - k.weekEnds - k.congesPayes - k.feriesEnSemaine;
  const terrain = ouvres - k.formation - k.bureau - k.salons;
  const visitesParJour = leviers.visitesParJour ?? VISITES_PAR_JOUR_DE_TERRAIN;
  return { ...k, ouvres, terrain, visitesParJour, capacite: terrain * visitesParJour };
}

/** Les comptes d'un commercial par classe ABC (le classement du cabinet, par le chiffre d'affaires). */
export function classesDuCommercial(f: FicheDuCabinet, code: CodeDeCommercial) {
  const abc = classementABC(f, "chiffreDAffaires");
  const comptes = abc.comptes.filter((c) => c.commercial === code);
  const de = (x: Classe) => comptes.filter((c) => c.classe === x);
  return { comptes, A: de("A"), B: de("B"), C: de("C") };
}

/** Les leviers du secteur : la fréquence de chaque classe, la part des visites des comptes C faites à distance, les visites d'un jour. */
export interface LeviersDuSecteur {
  frequenceA: number;
  frequenceB: number;
  frequenceC: number;
  /** De 0 à 1. */
  partDesCADistance: number;
  visitesParJour: number;
  /** Des visites de suivi en plus, d'une autre origine (des comptes repris, par exemple). */
  visitesEnPlus: number;
}

/**
 * LA CHARGE DE VISITES D'UN COMMERCIAL ET CE QUI RESTE POUR LA PROSPECTION. Les visites de suivi : comptes
 * × fréquence, classe par classe ; une visite à distance ne compte que pour le quart d'une visite sur
 * place. S'y ajoutent les rendez-vous d'affaires de N (le tableau de bord). La capacité moins la charge
 * donne les visites qui restent pour les prospects.
 */
export function chargeDeVisites(f: FicheDuCabinet, code: CodeDeCommercial = "entreprises", leviers: Partial<LeviersDuSecteur> = {}) {
  const k = classesDuCommercial(f, code);
  const l: LeviersDuSecteur = { frequenceA: FREQUENCE_DE_VISITE.A, frequenceB: FREQUENCE_DE_VISITE.B, frequenceC: FREQUENCE_DE_VISITE.C, partDesCADistance: 0, visitesParJour: VISITES_PAR_JOUR_DE_TERRAIN, visitesEnPlus: 0, ...leviers };
  const j = joursDeTerrain({ visitesParJour: l.visitesParJour });
  const visitesA = k.A.length * l.frequenceA;
  const visitesB = k.B.length * l.frequenceB;
  const visitesC = k.C.length * l.frequenceC;
  const cADistance = visitesC * l.partDesCADistance;
  const cSurPlace = visitesC - cADistance;
  const suiviEnTemps = visitesA + visitesB + cSurPlace + cADistance * VISITE_A_DISTANCE.partDuTemps + l.visitesEnPlus;
  const rendezVousDAffaires = somme(commercialDe(f, code).n.map((t) => t.rendezVous));
  const charge = suiviEnTemps + rendezVousDAffaires;
  const reste = j.capacite - charge;
  return {
    ...l,
    comptesA: k.A.length,
    comptesB: k.B.length,
    comptesC: k.C.length,
    capacite: j.capacite,
    visitesA,
    visitesB,
    visitesC,
    cADistance,
    cSurPlace,
    suivi: visitesA + visitesB + visitesC + l.visitesEnPlus,
    suiviEnTemps,
    rendezVousDAffaires,
    charge,
    reste,
    prospectsPossibles: Math.max(0, Math.floor(reste + 1e-9)),
    tientLObjectif: reste >= PROSPECTS_A_VOIR - 1e-9,
  };
}

/**
 * LE COÛT D'UNE VISITE : le coût annuel du commercial (salaire chargé et frais de la fiche, quatre
 * trimestres) ÷ ses visites de l'année (suivi et rendez-vous d'affaires, toutes sur place en N). Il se
 * partage en temps (le salaire) et en route (les frais). Une visite à distance ne coûte que le quart du
 * temps, et aucun frais de route.
 */
export function coutDUneVisite(f: FicheDuCabinet, code: CodeDeCommercial = "entreprises") {
  const c = commercialDe(f, code);
  const v = chargeDeVisites(f, code);
  const visites = v.suivi + v.rendezVousDAffaires;
  const salaire = c.salaireCharge * 4;
  const frais = c.frais * 4;
  const temps = auCentime(salaire / visites);
  const route = auCentime(frais / visites);
  return { visites, salaire, frais, coutAnnuel: salaire + frais, cout: auCentime((salaire + frais) / visites), temps, route, aDistance: auCentime(temps * VISITE_A_DISTANCE.partDuTemps) };
}

/** Ce que coûtent les visites des comptes C d'un commercial, face à ce qu'ils laissent de marge. */
export function visitesDesComptesC(f: FicheDuCabinet, code: CodeDeCommercial = "entreprises") {
  const k = classesDuCommercial(f, code);
  const v = chargeDeVisites(f, code);
  const u = coutDUneVisite(f, code);
  const marge = auCentime(somme(k.C.map((c) => c.marge)));
  const cout = auCentime(v.visitesC * u.cout);
  return { comptes: k.C.length, visites: v.visitesC, marge, cout, part: cout / marge, fraisDeRoute: auCentime(v.visitesC * u.route), coutADistance: auCentime(v.visitesC * u.aDistance) };
}

const distance = (a: string, b: string) => {
  const d = CARTE_DU_SECTEUR.distances[[a, b].sort().join("-")];
  if (d === undefined) throw new Error(`Pas de distance ${a}-${b}`);
  return d;
};

/** Une tournée qui part du bureau, passe par des comptes dans un ordre donné et y revient : ses kilomètres, ses heures et son coût. */
export function tournee(ordre: readonly string[]) {
  const etapes = ["bureau", ...ordre, "bureau"];
  const troncons = etapes.slice(1).map((b, i) => ({ de: etapes[i]!, a: b, km: distance(etapes[i]!, b) }));
  const km = somme(troncons.map((t) => t.km));
  const heuresDeRoute = km / ROUTE.vitesse;
  return { ordre, troncons, km, heuresDeRoute, heures: heuresDeRoute + ordre.length * ROUTE.heuresParVisite, cout: auCentime(km * ROUTE.coutDuKilometre) };
}

/** Les ordres possibles des comptes de l'agenda, la tournée de l'agenda et la plus courte (à égalité, la première trouvée). */
export function tourneesDuSecteur() {
  const permutations = (xs: readonly string[]): string[][] => (xs.length <= 1 ? [[...xs]] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
  const toutes = permutations(CARTE_DU_SECTEUR.agenda).map(tournee);
  const agenda = tournee(CARTE_DU_SECTEUR.agenda);
  const meilleure = toutes.reduce((a, b) => (b.km < a.km ? b : a));
  return { toutes, agenda, meilleure, kmEvites: agenda.km - meilleure.km, coutEvite: auCentime(agenda.cout - meilleure.cout) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. L'ÉVÈNEMENT COMMERCIAL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE BUDGET DES SALONS DE N (hypothèse du cours) : deux salons professionnels de trois jours, au printemps
 * (le Salon de l'entreprise de Granvaux, en mars, et le Forum régional des ressources humaines, en juin).
 * Les 17 200 € de stands et de déplacements de la fiche, ligne par ligne. Le temps des deux commerciaux
 * seniors sur les stands, puis aux rendez-vous qui suivent (20 000 €), est le reste du coût du canal.
 */
export const BUDGET_DES_SALONS: readonly { libelle: string; montant: number }[] = [
  { libelle: "Location des emplacements", montant: 8_400 },
  { libelle: "Aménagement et mobilier du stand", montant: 3_200 },
  { libelle: "Supports (plaquettes, kakémonos)", montant: 1_800 },
  { libelle: "Déplacements et hébergement", montant: 2_600 },
  { libelle: "Accueil et petits cadeaux", montant: 1_200 },
];

/** Une tâche du rétroplanning d'un salon, et le moment où elle se fait. */
export type MomentDuRetroplanning = "trois-mois-avant" | "un-mois-avant" | "la-semaine-du-salon" | "apres-le-salon";

/** LE RÉTROPLANNING D'UN SALON (la méthode du cabinet) : chaque tâche à sa date, en partant du jour du salon. */
export const RETROPLANNING_D_UN_SALON: readonly { tache: string; moment: MomentDuRetroplanning }[] = [
  { tache: "Réserver l'emplacement et fixer le budget", moment: "trois-mois-avant" },
  { tache: "Choisir l'objectif : contacts, rendez-vous, contrats", moment: "trois-mois-avant" },
  { tache: "Commander les plaquettes et le kakémono", moment: "un-mois-avant" },
  { tache: "Inviter les clients et les prospects du fichier", moment: "un-mois-avant" },
  { tache: "Fixer le planning des commerciaux sur le stand", moment: "la-semaine-du-salon" },
  { tache: "Relancer les invités par téléphone", moment: "la-semaine-du-salon" },
  { tache: "Saisir les contacts du stand dans le CRM", moment: "apres-le-salon" },
  { tache: "Dresser le bilan : coût par contact et par contrat", moment: "apres-le-salon" },
];

export type StadeDuPipeline = "devis-remis" | "projet-sans-devis";

/**
 * LE PIPELINE DES SALONS AU 31 DÉCEMBRE N (hypothèse du cours) : ce qui reste ouvert des contacts des
 * salons. Des 8 devis, 2 sont signés (les deux comptes de la fiche), 3 perdus, 3 encore sans réponse ;
 * des 32 rendez-vous sans devis, 4 ont un projet. Chaque opportunité porte le chiffre d'affaires de sa
 * première année. La probabilité de signer suit le stade et l'âge du contact (des salons du printemps) :
 * 20 % pour un devis sans réponse, à trois mois ; 5 % pour un projet sans devis, à six mois.
 */
export const PIPELINE_DES_SALONS = {
  devisPerdus: 3,
  opportunites: [
    { prospect: "Fonderies Arbelot", stade: "devis-remis", montant: 24_000 },
    { prospect: "Clinique du Val d'Orge", stade: "devis-remis", montant: 16_000 },
    { prospect: "Coopérative Bellerive", stade: "devis-remis", montant: 9_600 },
    { prospect: "Plasturgie Delorme", stade: "projet-sans-devis", montant: 20_000 },
    { prospect: "Groupe scolaire Saint-Aubin", stade: "projet-sans-devis", montant: 12_000 },
    { prospect: "Tanneries Massol", stade: "projet-sans-devis", montant: 8_000 },
    { prospect: "Mutuelle des artisans", stade: "projet-sans-devis", montant: 8_000 },
  ] as readonly { prospect: string; stade: StadeDuPipeline; montant: number }[],
  stades: {
    "devis-remis": { nom: "Devis remis, sans réponse", probabilite: 0.2, horizon: 3 },
    "projet-sans-devis": { nom: "Projet, pas encore de devis", probabilite: 0.05, horizon: 6 },
  } as Readonly<Record<StadeDuPipeline, { nom: string; probabilite: number; horizon: 3 | 6 }>>,
} as const;

/**
 * LES MATINALES CLIENTS (hypothèse du cours) : à la place des salons, deux petits-déjeuners de deux heures
 * dans les locaux du cabinet, autour d'un sujet (le management à distance, la formation des managers).
 * Une matinale coûte 6 000 € : le traiteur (1 200 €), les supports et les cadeaux (600 €), les invitations
 * et leurs relances (1 000 €), le temps des consultants et des commerciaux qui la préparent et l'animent
 * (3 200 €). Les invités viennent du fichier qualifié : 30 prospects présents par matinale, en plus des
 * clients. Venus pour un sujet, ils sont plus mûrs que les visiteurs d'un stand : un sur deux accepte un
 * rendez-vous, un rendez-vous sur trois mène à un devis, et les devis se signent au taux des salons
 * (2 sur 8, 25 %).
 */
export const MATINALES = {
  nombre: 2,
  coutDUneMatinale: { traiteur: 1_200, supports: 600, invitations: 1_000, temps: 3_200 },
  prospectsPresents: 30,
  tauxDeRendezVous: 0.5,
  devisParRendezVous: 1 / 3,
  tauxDeSignature: 0.25,
} as const;

/** Le bilan quantitatif d'un évènement : ce que coûte chaque marche de son entonnoir, et ce qu'il gagne à la valeur d'un compte. */
export function bilanDUnEvenement(e: { cout: number; contacts: number; rendezVous: number; devis: number; comptes: number }, valeurDUnCompte: number) {
  // Les rendez-vous, les devis et les comptes attendus au centième, comme sur la copie : les coûts et
  // le gain partent d'eux.
  const rendezVous = auCentime(e.rendezVous);
  const devis = auCentime(e.devis);
  const comptes = auCentime(e.comptes);
  const valeurCreee = auCentime(comptes * valeurDUnCompte);
  return {
    ...e,
    rendezVous,
    devis,
    comptes,
    coutParContact: auCentime(e.cout / e.contacts),
    coutParRendezVous: auCentime(e.cout / rendezVous),
    coutParDevis: auCentime(e.cout / devis),
    coutParCompte: auCentime(e.cout / comptes),
    valeurCreee,
    gain: auCentime(valeurCreee - e.cout),
    // L'autre chemin (pedagogy/cours/deux-decimales.ts, `deuxChemins`) : les comptes attendus gardés
    // avec tous leurs chiffres, l'arrondi à la fin.
    sansArrondi: { coutParCompte: e.cout / e.comptes, gain: e.comptes * valeurDUnCompte - e.cout },
  };
}

/** Les salons de N : leur budget, leur coût complet, leur entonnoir, leurs comptes et ce que vaut l'un d'eux. */
export function salonsDeN(f: FicheDuCabinet) {
  const canal = canalDe(f, "salons");
  const budget = somme(BUDGET_DES_SALONS.map((l) => l.montant));
  const comptes = f.comptes.filter((c) => c.origine === "salons");
  const v = valeurVieDUnGroupe(comptes);
  return {
    canal,
    budget,
    temps: canal.cout - budget,
    coutComplet: canal.cout,
    comptes,
    margePremiereAnnee: v.marge,
    valeurDUnCompte: v.valeurVie,
    attrition: v.attrition,
    bilan: bilanDUnEvenement({ cout: canal.cout, contacts: canal.contacts, rendezVous: canal.rendezVous, devis: canal.devis, comptes: canal.contrats }, v.valeurVie),
    contratsQuiPaientLaPremiereAnnee: plafond(canal.cout / v.marge),
    contratsQuiPaientEnValeurVie: plafond(canal.cout / v.valeurVie),
  };
}

/** Le pipeline des salons : le chiffre d'affaires pondéré à trois et à six mois, et les comptes qu'on peut en attendre. */
export function pipelineDesSalons() {
  const p = PIPELINE_DES_SALONS;
  const lignes = p.opportunites.map((o) => {
    const s = p.stades[o.stade];
    return { ...o, ...s, pondere: auCentime(o.montant * s.probabilite) };
  });
  const aTroisMois = auCentime(somme(lignes.filter((l) => l.horizon <= 3).map((l) => l.pondere)));
  const aSixMois = auCentime(somme(lignes.map((l) => l.pondere)));
  return { lignes, brut: somme(lignes.map((l) => l.montant)), aTroisMois, aSixMois, comptesAttendus: somme(lignes.map((l) => l.probabilite)) };
}

/** Les leviers des matinales : leur nombre et les prospects présents à chacune. */
export function matinales(f: FicheDuCabinet, leviers: Partial<{ nombre: number; prospectsPresents: number; coutEnPlus: number }> = {}) {
  const m = MATINALES;
  const nombre = leviers.nombre ?? m.nombre;
  const presents = leviers.prospectsPresents ?? m.prospectsPresents;
  const coutDUne = somme(Object.values(m.coutDUneMatinale)) + (leviers.coutEnPlus ?? 0);
  const contacts = nombre * presents;
  const rendezVous = contacts * m.tauxDeRendezVous;
  const devis = rendezVous * m.devisParRendezVous;
  const comptes = devis * m.tauxDeSignature;
  const s = salonsDeN(f);
  return { nombre, presents, coutDUne, comptesParProspect: m.tauxDeRendezVous * m.devisParRendezVous * m.tauxDeSignature, ...bilanDUnEvenement({ cout: nombre * coutDUne, contacts, rendezVous, devis, comptes }, s.valeurDUnCompte) };
}

/** Les leviers d'un salon refait : ses visiteurs, son taux de rendez-vous et son taux de signature des devis. */
export function salonRefait(f: FicheDuCabinet, leviers: Partial<{ visiteurs: number; tauxDeRendezVous: number; tauxDeSignature: number }> = {}) {
  const s = salonsDeN(f);
  const c = s.canal;
  const visiteurs = leviers.visiteurs ?? c.contacts;
  const tauxDeRendezVous = leviers.tauxDeRendezVous ?? c.rendezVous / c.contacts;
  const tauxDeSignature = leviers.tauxDeSignature ?? c.contrats / c.devis;
  const rendezVous = visiteurs * tauxDeRendezVous;
  const devis = rendezVous * (c.devis / c.rendezVous);
  const comptes = devis * tauxDeSignature;
  return { visiteurs, tauxDeRendezVous, tauxDeSignature, ...bilanDUnEvenement({ cout: s.coutComplet, contacts: visiteurs, rendezVous, devis, comptes }, s.valeurDUnCompte) };
}
