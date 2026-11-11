import { aLUnite, arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { BOUTIQUES_DU_COURS, type CodeDeReference, type FicheDeLaBoutique } from "./maille-et-co";

/**
 * LE MONDE DU COURS : LE RÉSEAU DE VENTE DIRECTE DE MAILLE & CO (BTS NDRC, bloc 3, chapitre « Le
 * réseau de vente directe : recruter, animer, rémunérer »).
 *
 * Hypothèse du chapitre (décision du propriétaire, novembre 2026) : la boutique lance un réseau de
 * conseillères, des vendeuses à domicile indépendantes (VDI), qui vendent ses pulls et ses
 * accessoires en réunion chez une hôtesse. Elles vendent les MÊMES références, aux MÊMES étiquettes,
 * achetées au MÊME façonnier (maille-et-co.ts) ; la formation des recrues est donnée par l'adjointe de
 * la boutique, en heures supplémentaires, à son salaire de la fiche. Rien ne change pour la boutique
 * elle-même : ni ses ventes de janvier, ni son équipe, ni son planning.
 *
 * Tout est hors taxes, sauf le chiffre d'affaires de la réunion, qui se lit aussi taxes comprises
 * (l'étiquette). La garde tests/cours/le-reseau-de-vente-directe.test.ts refait chaque chiffre à la
 * main ; tests/cours/une-seule-maille-et-co.test.ts vérifie les prix, les coûts et le salaire lus.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LA RÉUNION À DOMICILE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA RÉUNION TYPE (hypothèse du cours) : une hôtesse reçoit 8 participantes, dont 6 achètent (75 %).
 * Elles achètent, à elles toutes, 3 pulls col rond, 2 cardigans, 1 pull mérinos, 3 écharpes et
 * 2 bonnets, aux étiquettes de la boutique.
 */
export const REUNION_TYPE = {
  participantes: 8,
  acheteuses: 6,
  articles: [
    { reference: "col-rond", quantite: 3 },
    { reference: "cardigan", quantite: 2 },
    { reference: "merinos", quantite: 1 },
    { reference: "echarpe", quantite: 3 },
    { reference: "bonnet", quantite: 2 },
  ] as readonly { reference: CodeDeReference; quantite: number }[],
} as const;

/** LE CADEAU DE L'HÔTESSE (hypothèse du cours) : une écharpe, comptée à son coût d'achat. */
export const CADEAU_DE_L_HOTESSE: CodeDeReference = "echarpe";

/**
 * LA COMMISSION DE LA CONSEILLÈRE (hypothèse du cours) : 25 % du chiffre d'affaires hors taxes de ses
 * réunions. Elle est VDI mandataire : elle vend au nom de la boutique, qui facture et livre. Les
 * cotisations sociales dues sur la rémunération d'une VDI se calculent sur une assiette forfaitaire
 * réduite ; la simulation les néglige. // À VÉRIFIER
 */
export const COMMISSION_DE_LA_CONSEILLERE = 0.25;

/** Les bornes de la commission au laboratoire, en % du chiffre d'affaires hors taxes. */
export const COMMISSION_DU_LABORATOIRE = { min: 20, max: 30, pas: 1 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. LA CONSEILLÈRE : SON ACTIVITÉ, SON STATUT, SA DURÉE DANS LE RÉSEAU
// ─────────────────────────────────────────────────────────────────────────────

/** LES RÉUNIONS D'UNE CONSEILLÈRE (hypothèse du cours) : 2 par mois en moyenne. */
export const REUNIONS_PAR_MOIS = 2;

/** L'ATTRITION DU RÉSEAU (hypothèse du cours) : chaque mois, une conseillère sur 10 arrête. */
export const ATTRITION_MENSUELLE = 0.1;

/**
 * LE PLAFOND ANNUEL DE LA SÉCURITÉ SOCIALE en 2026 : 48 060 €. // À VÉRIFIER
 * Une VDI est dispensée d'immatriculation tant que sa rémunération annuelle ne dépasse pas la moitié
 * de ce plafond, trois années civiles de suite : c'est son seuil d'activité. // À VÉRIFIER
 */
export const PLAFOND_ANNUEL_DE_LA_SECURITE_SOCIALE = 48_060;
export const PART_DU_PLAFOND_POUR_L_IMMATRICULATION = 0.5;

/**
 * LA FORMATION D'UNE RECRUE (hypothèse du cours) : un kit de démarrage, un article de chaque
 * référence, compté au coût d'achat ; et 4 heures avec l'adjointe de la boutique, après la fermeture,
 * payées en heures supplémentaires majorées de 25 % (le taux légal des huit premières), cotisations
 * patronales de la fiche comprises.
 */
export const FORMATION = { heures: 4, formatrice: "adjointe", majoration: 0.25 } as const;

/** Les heures d'un mois pour 35 heures par semaine, au centième : 35 × 52 ÷ 12. */
export const HEURES_DU_MOIS_A_TEMPS_PLEIN = 151.67;

// ─────────────────────────────────────────────────────────────────────────────
// 3. LE PARRAINAGE, LA RÉTRACTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE PARRAINAGE (hypothèse du cours) : une prime versée à la marraine pour chaque filleule, une fois
 * sa première réunion tenue. Sans prime, le réseau recrute 24 conseillères par an (des invitées qui le
 * demandent) ; avec une prime, plus, mais de moins en moins à chaque palier. La prime se verse sur
 * TOUTES les filleules, celles qui seraient venues sans elle comprises.
 */
export const OFFRES_DE_PARRAINAGE: readonly { prime: number; recrues: number }[] = [
  { prime: 0, recrues: 24 },
  { prime: 150, recrues: 30 },
  { prime: 300, recrues: 33 },
  { prime: 450, recrues: 35 },
];

/**
 * LA RÉTRACTATION : une vente conclue hors établissement, chez l'hôtesse, laisse à l'acheteuse 14 jours
 * pour se rétracter (code de la consommation). HYPOTHÈSE DU COURS : 5 % du chiffre d'affaires d'une
 * réunion revient ; les articles rentrent en stock, sans commission.
 */
export const DELAI_DE_RETRACTATION = 14;
export const TAUX_DE_RETRACTATION = 0.05;

// ─────────────────────────────────────────────────────────────────────────────
// 4. LE MODÈLE
// ─────────────────────────────────────────────────────────────────────────────

const auCentime = arrondi2;

/** La fiche de la boutique d'un cas. */
export const ficheDuReseau = (c: { code: string }): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

const referenceDe = (f: FicheDeLaBoutique, code: CodeDeReference) => f.gamme.find((r) => r.code === code)!;

/** La réunion type, à une commission donnée (en part du chiffre d'affaires hors taxes). */
export function reunionADomicile(f: FicheDeLaBoutique, commission: number = COMMISSION_DE_LA_CONSEILLERE) {
  const lignes = REUNION_TYPE.articles.map((a) => {
    const r = referenceDe(f, a.reference);
    return { reference: a.reference, nom: r.nom, quantite: a.quantite, prixTtc: r.prixTtc, prixHt: r.prixHt, coutDAchat: r.coutDAchat, autres: r.autresCoutsVariables };
  });
  const somme = (g: (l: (typeof lignes)[number]) => number) => auCentime(lignes.reduce((t, l) => t + l.quantite * g(l), 0));
  const chiffreTtc = somme((l) => l.prixTtc);
  const chiffreHt = somme((l) => l.prixHt);
  const achats = somme((l) => l.coutDAchat);
  const autres = somme((l) => l.autres);
  const margeSurCoutVariable = auCentime(chiffreHt - achats - autres);
  const commissionDeLaReunion = auCentime(chiffreHt * commission);
  const cadeau = referenceDe(f, CADEAU_DE_L_HOTESSE).coutDAchat;
  return {
    lignes,
    articles: lignes.reduce((t, l) => t + l.quantite, 0),
    participantes: REUNION_TYPE.participantes,
    acheteuses: REUNION_TYPE.acheteuses,
    tauxDAchat: REUNION_TYPE.acheteuses / REUNION_TYPE.participantes,
    chiffreTtc,
    chiffreHt,
    panierTtc: auCentime(chiffreTtc / REUNION_TYPE.acheteuses),
    achats,
    autres,
    margeSurCoutVariable,
    commission,
    commissionDeLaReunion,
    cadeau,
    marge: auCentime(margeSurCoutVariable - commissionDeLaReunion - cadeau),
  };
}

export type ReunionADomicile = ReturnType<typeof reunionADomicile>;

/** Ce que coûte la formation d'une recrue : le kit et les heures de l'adjointe. */
export function formationDUneRecrue(f: FicheDeLaBoutique) {
  const kit = auCentime(f.gamme.reduce((t, r) => t + r.coutDAchat, 0));
  const formatrice = f.equipe.find((s) => s.code === FORMATION.formatrice)!;
  const horaireBrut = formatrice.brutMensuel / HEURES_DU_MOIS_A_TEMPS_PLEIN;
  const coutHoraire = auCentime(horaireBrut * (1 + FORMATION.majoration) * (1 + f.tauxPatronal));
  const heures = auCentime(coutHoraire * FORMATION.heures);
  return { kit, formatrice, coutHoraire, heures, cout: auCentime(kit + heures) };
}

/** La valeur d'une conseillère sur sa vie dans le réseau : ses réunions, moins sa formation. */
export function valeurDUneConseillere(f: FicheDeLaBoutique, margeDUneReunion: number) {
  // La durée de vie, une grandeur au centième ; les réunions, à l'unité la plus proche.
  const dureeDeVie = auCentime(1 / ATTRITION_MENSUELLE);
  const reunions = aLUnite(dureeDeVie * REUNIONS_PAR_MOIS);
  const marge = auCentime(reunions * margeDUneReunion);
  const formation = formationDUneRecrue(f).cout;
  return { dureeDeVie, reunions, marge, formation, valeur: auCentime(marge - formation) };
}

/**
 * Les recrues de l'année à une prime donnée : celles des offres, et entre deux offres, la droite qui les
 * joint (le graphique du laboratoire trace une courbe continue). Au-delà de la dernière, la dernière.
 */
export function recruesALaPrime(prime: number): number {
  const o = OFFRES_DE_PARRAINAGE;
  if (prime <= o[0]!.prime) return o[0]!.recrues;
  for (let i = 1; i < o.length; i++) {
    const a = o[i - 1]!;
    const b = o[i]!;
    if (prime <= b.prime) return a.recrues + ((b.recrues - a.recrues) * (prime - a.prime)) / (b.prime - a.prime);
  }
  return o.at(-1)!.recrues;
}

/** Le parrainage à une prime donnée : les recrues de l'année, celles en plus, les primes versées et le gain. */
export function parrainage(valeur: number, prime: number) {
  const sans = OFFRES_DE_PARRAINAGE[0]!;
  const o = { prime, recrues: recruesALaPrime(prime) };
  const enPlus = o.recrues - sans.recrues;
  const valeurDesRecruesEnPlus = auCentime(enPlus * valeur);
  const primes = auCentime(o.prime * o.recrues);
  return {
    prime,
    recrues: o.recrues,
    enPlus,
    valeurDesRecruesEnPlus,
    primes,
    gain: auCentime(valeurDesRecruesEnPlus - primes),
    // Le piège : la prime comptée sur les seules recrues en plus.
    gainSurLesSeulesRecruesEnPlus: auCentime(valeurDesRecruesEnPlus - o.prime * enPlus),
  };
}

/** La prime qui laisse le plus grand gain, à une valeur de conseillère donnée. */
export const meilleurePrime = (valeur: number) =>
  OFFRES_DE_PARRAINAGE.map((o) => parrainage(valeur, o.prime)).reduce((a, p) => (p.gain > a.gain ? p : a)).prime;

/** Tout ce que le chapitre et son cas lisent, à la boutique. */
export function reseauDeVenteDirecte(f: FicheDeLaBoutique) {
  const reunion = reunionADomicile(f);
  const seuilDImmatriculation = auCentime(PLAFOND_ANNUEL_DE_LA_SECURITE_SOCIALE * PART_DU_PLAFOND_POUR_L_IMMATRICULATION);
  // Le quotient à deux décimales, puis à l'unité au-dessus, comme sur la copie.
  const reunionsAuSeuil = Math.ceil(auCentime(seuilDImmatriculation / reunion.commissionDeLaReunion) - 1e-9);
  const commissionDeLAnnee = auCentime(reunion.commissionDeLaReunion * REUNIONS_PAR_MOIS * 12);
  const formation = formationDUneRecrue(f);
  const conseillere = valeurDUneConseillere(f, reunion.marge);
  const offres = OFFRES_DE_PARRAINAGE.map((o) => parrainage(conseillere.valeur, o.prime));
  const prime = meilleurePrime(conseillere.valeur);
  const piege = offres.reduce((a, p) => (p.gainSurLesSeulesRecruesEnPlus > a.gainSurLesSeulesRecruesEnPlus ? p : a)).prime;
  // La variante : la réunion nette des rétractations.
  const retracte = auCentime(reunion.chiffreHt * TAUX_DE_RETRACTATION);
  const coutsEvites = auCentime((reunion.achats + reunion.autres) * TAUX_DE_RETRACTATION);
  const commissionNonDue = auCentime(reunion.commissionDeLaReunion * TAUX_DE_RETRACTATION);
  const margePerdue = auCentime(retracte - coutsEvites - commissionNonDue);
  const margeNette = auCentime(reunion.marge - margePerdue);
  const conseillereNette = valeurDUneConseillere(f, margeNette);
  return {
    reunion,
    seuilDImmatriculation,
    reunionsAuSeuil,
    reunionsAuSeuilParMois: auCentime(reunionsAuSeuil / 12),
    commissionDeLAnnee,
    partDuSeuil: commissionDeLAnnee / seuilDImmatriculation,
    formation,
    conseillere,
    offres,
    prime,
    parrainageRetenu: offres.find((p) => p.prime === prime)!,
    piege,
    retractation: { retracte, coutsEvites, commissionNonDue, margePerdue, margeNette, conseillere: conseillereNette, prime: meilleurePrime(conseillereNette.valeur) },
  };
}

export type ReseauDeVenteDirecte = ReturnType<typeof reseauDeVenteDirecte>;

/** Le laboratoire du réseau : une commission (en %) et une prime de parrainage. */
export function laboratoireDuReseau(f: FicheDeLaBoutique, commissionEnPourcent: number, prime: number) {
  const reunion = reunionADomicile(f, commissionEnPourcent / 100);
  const conseillere = valeurDUneConseillere(f, reunion.marge);
  const p = parrainage(conseillere.valeur, prime);
  return {
    margeDUneReunion: reunion.marge,
    valeur: conseillere.valeur,
    recrues: p.recrues,
    primes: p.primes,
    gain: p.gain,
    commissionDeLAnnee: auCentime(reunion.commissionDeLaReunion * REUNIONS_PAR_MOIS * 12),
    meilleurePrime: meilleurePrime(conseillere.valeur),
  };
}

/** Le cas : un pourcentage pour la marraine, sur le chiffre d'affaires de chaque réunion de sa filleule. */
export function pourcentageDeLaMarraine(f: FicheDeLaBoutique, taux: number) {
  const x = reseauDeVenteDirecte(f);
  const retenu = x.parrainageRetenu;
  const parReunion = auCentime(x.reunion.chiffreHt * taux);
  const parFilleule = auCentime(parReunion * x.conseillere.reunions);
  const deLAnnee = auCentime(parFilleule * retenu.recrues);
  return { x, retenu, parReunion, parFilleule, deLAnnee, gain: auCentime(retenu.valeurDesRecruesEnPlus - deLAnnee) };
}
