/**
 * L'APPEL D'OFFRES — le modèle de l'équipe grands comptes.
 *
 * Balmes Habitat, un bailleur social, consulte pour fournir les matériaux de
 * rénovation de 1 200 logements sur trois ans. Quatre semaines pour répondre,
 * une équipe déjà prise par les comptes en place, et deux autres
 * consultations qui tombent en même temps. Treize semaines, six décisions.
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · ON NE GAGNE PAS TOUT CE À QUOI ON RÉPOND. L'équipe a six jours par
 *     semaine à donner aux offres ; au-delà, chaque jour pris aux offres est
 *     pris aux clients en place : des devis en retard, des commandes qui
 *     partent, un premier client qui s'agace. Et un dossier préparé par une
 *     équipe débordée se lit sur la note. Répondre à tout dilue l'effort et
 *     fait perdre le dossier qui compte.
 *   · LA GRILLE DIT OÙ SONT LES POINTS. Balmes note le prix sur 40 et la
 *     valeur technique sur 60. Chaque pour cent de prix au-dessus du
 *     moins-disant coûte 0,8 point ; un mémoire qui répond critère par
 *     critère — livraisons en logements occupés, réassort, RSE — en rapporte
 *     une douzaine. Les questions posées à l'acheteuse pendant la
 *     consultation disent ce qu'elle note, et ce que le marché coûtera.
 *   · UN MARCHÉ GAGNÉ À PERTE COÛTE TROIS ANS. La marge nette d'un tel marché
 *     est mince : 5 % au tarif grands comptes, coût du service déduit. Chaque
 *     point de remise s'y paie pendant toute la durée du marché ; sous le
 *     plancher, gagner coûte plus que perdre. Une concession s'échange contre
 *     une contrepartie qui réduit le coût du service ; elle ne se donne pas.
 *
 * Le trimestre est jugé en euros : la marge des marchés gagnés, sur leur
 * durée et actualisée, moins le coût de préparation des réponses et ce que
 * la surcharge a coûté aux comptes en place, en écart à l'objectif de la
 * direction.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les jours de travail de l'équipe par semaine : Vincent, deux chargés d'affaires, une chargée d'études de prix. */
export const CAPACITE = 20;
/** Les jours que les comptes en place demandent chaque semaine : devis, suivi, livraisons. */
export const COURANT = 14;
/** Une journée de l'équipe passée à une offre, charges comprises. */
export const COUT_JOUR = 450;
/** La marge perdue sur les comptes en place pour chaque jour de surcharge : devis en retard, commandes parties. */
export const PERTE_SURCHARGE = 2500;
export const DEVIS_DEPART = 7;
/** La marge nouvelle que la direction attend du trimestre, nette des coûts de préparation et des pertes. */
export const OBJECTIF = 40000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, des devis attendent et le dossier prend du retard. */
export const PERTE_PAR_JOUR = 1500;

/** Balmes Habitat : 1 200 logements, trois ans. */
export const CA_BALMES = 2400000;
/** La marge nette au tarif grands comptes, coût du service déduit, livraisons planifiées. */
export const MARGE_TARIF = 0.05;
/** La marge nette en dessous de laquelle un marché de trois ans ne vaut pas d'être gagné. */
export const PLANCHER = 0.02;
/** Ce que coûtent les livraisons en logements occupés quand on ne les a pas prévues. */
export const SURCOUT_OCCUPE = 0.02;
/** La marge des trois années ramenée au trimestre de la signature. */
export const ACTUALISATION = 0.93;
/** Une ligne du bordereau chiffrée à l'unité au lieu du carton : trois ans à ce prix. */
export const ERREUR_BPU = 15000;
export const NOTE_PRIX = 40;
/** Chaque pour cent au-dessus de l'offre la moins chère retire 2 % de la note prix. */
export const PENTE_PRIX = 2;
/** La note technique d'un mémoire type, adapté à la marge : celle des réponses de l'an dernier. */
export const TECHNIQUE_BASE = 36;

/** Le Haut-Garon : outillage et équipements de protection, deux ans ; la marge actualisée si on gagne. */
export const VAN_GARON = 34000;
/** Maisons Ardanel : gros œuvre, un an, prix serrés ; la marge actualisée si on gagne. */
export const VAN_ARDANEL = 22000;
/** Groupe Vauclair, premier compte en place : son accord annuel, et la marge nette qu'il porte. */
export const CA_VAUCLAIR = 700000;
export const MARGE_VAUCLAIR = 0.08;
export const ACTU_VAUCLAIR = 0.95;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  tri: 0,
  questions: 1,
  memoire: 2,
  prix: 3,
  negociation: 4,
  vauclair: 5,
} as const;

/** Ne rien changer, décision par décision : répondre à tout comme d'habitude, sans rien demander. */
export const NEUTRE = [0, 0, 0, 2, 2, 3] as const;

/** Le prix remis à Balmes, rapporté au tarif grands comptes, selon la décision 4. */
export const PRIX = [0.94, 1, 1.04, 0.97] as const;
/** Ce que la négociation retire du prix, ce qu'elle fait gagner sur le coût du service, et les points techniques ajoutés. */
export const CONCESSION = [0.05, 0.02, 0, 0] as const;
export const ECONOMIE = [0, 0.015, 0, -0.008] as const;
export const TECHNIQUE_NEGOCIATION = [0, 0, 0, 1.5] as const;
/** Les jours que demande chaque façon d'écrire le mémoire technique. */
export const JOURS_MEMOIRE = [3, 9, 10, 2] as const;

export const COUTS = {
  cabinet: 7000,
  renfort: 2000,
  echantillons: 1500,
  dossierGaron: 300,
} as const;

/** Une fois sur deux, un autre candidat pose la question des logements occupés. */
export const CHANCE_PUBLIEES = 0.5;
export const CHANCE_ARDANEL = 0.08;
export const CHANCE_GARON = 0.5;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  duree: number;
  /** Jours de l'équipe perdus par semaine ; marge perdue sur les comptes en place ; marge nette de Balmes. */
  effet: { jours?: number; marge?: number; balmes?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "grippe",
    titre: "Grippe dans l'équipe",
    de: "Ressources humaines",
    role: "Agence grands comptes",
    texte:
      "La grippe passe dans l'équipe : un chargé d'affaires absent une semaine, puis la chargée d'études de prix.",
    duree: 2,
    effet: { jours: 3 },
  },
  {
    id: "plateforme",
    titre: "Panne de la plateforme des marchés",
    de: "Service informatique",
    role: "Siège",
    texte:
      "La plateforme de dématérialisation des marchés est restée inaccessible deux jours : téléchargements et dépôts à refaire, une journée et demie de perdue.",
    duree: 1,
    effet: { jours: 1.5 },
  },
  {
    id: "urgence",
    titre: "Un chantier en urgence",
    de: "Groupe Vauclair",
    role: "Conducteur de travaux",
    texte:
      "Un dégât des eaux sur une résidence : Vauclair a besoin de 40 portes et de plaques sous 48 heures. Deux jours de l'équipe, et une belle commande.",
    duree: 1,
    effet: { jours: 2, marge: -4000 },
  },
  {
    id: "cuivre",
    titre: "Flambée du cuivre",
    de: "Achats",
    role: "Siège",
    texte:
      "Le cuivre prend 12 % en deux semaines : tubes et raccords augmentent, les clients en place renâclent, et la première année de Balmes serait à prix ferme.",
    duree: 1,
    effet: { marge: 3000, balmes: -0.004 },
  },
  {
    id: "transport",
    titre: "Grève des transporteurs",
    de: "Logistique",
    role: "Dépôt de Corbas",
    texte:
      "Grève chez le transporteur régional : des livraisons de chantier en retard, des clients à rappeler un par un, des gestes commerciaux.",
    duree: 1,
    effet: { jours: 1, marge: 5000 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

/** Ce que les concurrents remettent à Balmes : note technique, prix rapporté à notre tarif, effort en négociation. */
export interface Concurrent {
  technique: number;
  prix: number;
  concession: number;
}

export interface Hasard {
  /** La charge des comptes en place, semaine par semaine, autour de sa moyenne. */
  courant: readonly number[];
  /** Gabriac Matériaux, le sortant, et Grandval Distribution, le national agressif. */
  gabriac: Concurrent;
  grandval: Concurrent;
  /** Un autre candidat pose-t-il la question des logements occupés ? */
  uPubliees: number;
  uArdanel: number;
  uGaron: number;
  /** Une erreur se glisse-t-elle dans le bordereau de prix ? */
  uErreur: number;
  /** Vauclair reste-t-il ? */
  uVauclair: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
/** La valeur d'une option dans une table, ou une valeur par défaut. */
const parOption = (table: readonly number[], option: number | undefined, defaut: number) =>
  table[option ?? -1] ?? defaut;

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000003 + 7);
  const courant: number[] = [0];
  for (let i = 1; i <= SEMAINES; i += 1) courant.push(borne(1 + 0.035 * gauss(r), 0.92, 1.08));
  const gabriac = {
    technique: borne(43 + 2.5 * gauss(r), 37, 49),
    prix: borne(0.98 + 0.012 * gauss(r), 0.95, 1.01),
    concession: 0.01 + 0.02 * r(),
  };
  const grandval = {
    technique: borne(35 + 2.5 * gauss(r), 29, 41),
    prix: borne(0.945 + 0.012 * gauss(r), 0.915, 0.975),
    concession: 0.01 + 0.03 * r(),
  };
  const uPubliees = r();
  const uArdanel = r();
  const uGaron = r();
  const uErreur = r();
  const uVauclair = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = {
    courant,
    gabriac,
    grandval,
    uPubliees,
    uArdanel,
    uGaron,
    uErreur,
    uVauclair,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUE CHAQUE RÉPONSE DEMANDE À L'ÉQUIPE, semaine par semaine.
 * ------------------------------------------------------------------------- */

export const repondArdanel = (chemin: readonly number[]) =>
  chemin[D.tri] === 0 || chemin[D.tri] === 3;
export const repondGaron = (chemin: readonly number[]) => chemin[D.tri] !== 2;

/** Les jours que Balmes demande en semaine w : lecture, analyse, questions, mémoire, prix, négociation. */
export function joursBalmes(chemin: readonly number[], w: number): number {
  const memoire = parOption(JOURS_MEMOIRE, chemin[D.memoire], 3);
  if (w === 1) return 1;
  if (w === 2) return 2;
  if (w === 3) return 2 + (chemin[D.questions] === 1 || chemin[D.questions] === 2 ? 0.5 : 0);
  if (w === 4) return memoire / 2;
  if (w === 5) return memoire / 2 + 1.5;
  if (w === 8) return 1.5 + (chemin[D.negociation] === 1 ? 0.5 : 0);
  return 0;
}

/** Ardanel : un bordereau de 400 lignes et des échantillons, remis en semaine 3. */
export function joursArdanel(chemin: readonly number[], w: number): number {
  if (!repondArdanel(chemin)) return 0;
  return [0, 3, 4, 5][w] ?? 0;
}

/** Le Haut-Garon, remis en semaine 4 : une réponse complète, ou une réponse légère sur le mémoire type. */
export function joursGaron(chemin: readonly number[], w: number): number {
  if (!repondGaron(chemin)) return 0;
  const leger = chemin[D.tri] === 1;
  return (leger ? [0, 0, 1, 1.5, 1.5] : [0, 0, 1, 2, 2.5])[w] ?? 0;
}

/** Ce que le dossier Balmes a demandé jusqu'à sa remise, en fin de semaine 5. */
export const totalBalmes = (chemin: readonly number[]) =>
  [1, 2, 3, 4, 5].reduce((s, w) => s + joursBalmes(chemin, w), 0);

/**
 * L'ÉQUIPE A-T-ELLE PU FAIRE LE DOSSIER ?
 *
 * Chaque jour de surcharge entre la semaine 2 et la semaine 5 se lit sur le
 * dossier Balmes : une analyse survolée, un mémoire écrit la nuit, une
 * relecture sautée. La qualité tombe de 5 % par jour, jusqu'à moitié.
 */
export const qualite = (surcharge: number) => borne(1 - 0.05 * surcharge, 0.5, 1);

/** Le risque d'une erreur dans le bordereau de prix, lu sur la surcharge des semaines 2 à 5. */
export const risqueErreur = (surcharge: number) => Math.min(0.5, 0.05 * surcharge);

/** L'équipe sait-elle que 60 % des logements seront occupés pendant les travaux ? */
export const connaitSites = (chemin: readonly number[], graine: number) =>
  chemin[D.questions] === 1 ||
  (chemin[D.questions] === 3 && hasard(graine).uPubliees < CHANCE_PUBLIEES);

/**
 * VAUCLAIR RESTE-T-IL ?
 *
 * Son acheteur demande 5 % de remise sur l'accord de l'an prochain. S'aligner
 * le garde à coup sûr ; une revue d'affaires, des devis rattrapés et un effort
 * ciblé le gardent presque toujours — sauf si l'équipe l'a négligé pendant les
 * appels d'offres : chaque jour de surcharge du trimestre pèse sur sa patience.
 */
export function chanceQueVauclairReste(choix: number, surcharge: number): number {
  const base = parOption([1, 0.92, 0.6, 0.5], choix, 0.5);
  const pente = parOption([0, 0.03, 0.04, 0.04], choix, 0.04);
  return borne(base - pente * surcharge, 0.05, 1);
}

/** Ce que l'accord Vauclair de l'an prochain perd, ramené au trimestre, selon l'issue. */
export function perteVauclair(choix: number, reste: boolean): number {
  if (!reste) return CA_VAUCLAIR * MARGE_VAUCLAIR * ACTU_VAUCLAIR;
  const remise = parOption([0.05, 0.006, 0, 0.03], choix, 0);
  return CA_VAUCLAIR * remise * ACTU_VAUCLAIR;
}

/** La note prix de la formule de Balmes. */
export const notePrix = (prix: number, moinsDisant: number) =>
  NOTE_PRIX * Math.max(0, 1 - (PENTE_PRIX * (prix - moinsDisant)) / moinsDisant);

export interface Attribution {
  gagne: boolean;
  /** Le rang de l'offre d'Arvel parmi les trois. */
  rang: number;
  technique: number;
  prix: number;
  notePrix: number;
  note: number;
  /** La note du mieux classé des concurrents, et son nom. */
  noteConcurrent: number;
  laureat: string;
  /** La marge nette du marché si Arvel le gagne, et sa valeur sur trois ans. */
  marge: number;
  valeur: number;
  erreur: boolean;
}

/**
 * LA NOTE DE BALMES.
 *
 * Valeur technique sur 60 : le mémoire, ce que l'équipe a compris de la
 * grille et des chantiers, et le soin qu'elle a pu y mettre. Prix sur 40,
 * relatif au moins-disant, après négociation. Le mieux noté gagne.
 */
export function attribuer(
  chemin: readonly number[],
  graine: number,
  surcharge: number,
  cuivre: number,
): Attribution {
  const h = hasard(graine);
  const [, d2, d3, d4, d5] = chemin;
  const q = qualite(surcharge);
  const sites = connaitSites(chemin, graine);
  const grille = d2 === 1;
  const publie = d2 === 1 || h.uPubliees < CHANCE_PUBLIEES;
  let bonus = 0;
  if (d3 === 1) bonus = (8 + (grille ? 2 : 0) + (sites ? 2 : 0)) * q;
  if (d3 === 2) bonus = 2 * q;
  if (d3 === 3) bonus = 6 + (grille ? 1 : 0) + (sites ? 1 : 0);
  const technique = TECHNIQUE_BASE - 4 * (1 - q) + bonus + parOption(TECHNIQUE_NEGOCIATION, d5, 0);
  const prix = parOption(PRIX, d4, 1) * (1 - parOption(CONCESSION, d5, 0));
  const g = h.gabriac;
  const v = h.grandval;
  const prixG = g.prix * (1 - g.concession);
  const prixV = v.prix * (1 - v.concession);
  const moins = Math.min(prix, prixG, prixV);
  const nous = technique + notePrix(prix, moins);
  const noteG = g.technique + notePrix(prixG, moins);
  // Les réponses publiées servent aussi le concurrent qui n'aurait pas posé la question.
  const noteV = v.technique + (publie ? 1 : 0) + notePrix(prixV, moins);
  const gagne = nous > noteG && nous > noteV;
  const rang = 1 + (noteG >= nous ? 1 : 0) + (noteV >= nous ? 1 : 0);
  const marge =
    MARGE_TARIF - (1 - prix) - (sites ? 0 : SURCOUT_OCCUPE) + parOption(ECONOMIE, d5, 0) + cuivre;
  const erreur = h.uErreur < risqueErreur(surcharge);
  const valeur = CA_BALMES * marge * ACTUALISATION - (erreur ? ERREUR_BPU : 0);
  return {
    gagne,
    rang,
    technique,
    prix,
    notePrix: notePrix(prix, moins),
    note: nous,
    noteConcurrent: Math.max(noteG, noteV),
    laureat: gagne ? "Arvel" : noteG >= noteV ? "Gabriac" : "Grandval",
    marge,
    valeur,
    erreur,
  };
}

export type Semaine = {
  /** Ce que l'équipe avait à faire, rapporté à ce qu'elle pouvait faire. */
  charge: number;
  /** Les jours de travail qui ont manqué. */
  surcharge: number;
  /** Les devis des comptes en place qui attendent. */
  devis: number;
  /** L'avancement du dossier Balmes, jusqu'à sa remise. */
  dossier: number;
  /** Coûts de préparation cumulés : jours passés aux offres, cabinet, renfort, échantillons. */
  prepa: number;
  /** Marge signée cumulée : la valeur actualisée des marchés gagnés. */
  signe: number;
  /** Pertes cumulées sur les comptes en place : surcharge, imprévus, Vauclair. */
  pertes: number;
  /** Ce que la semaine a rapporté : marge signée, moins préparation et pertes. */
  contribution: number;
  /** Le résultat cumulé depuis le début du trimestre. */
  cumul: number;
};

export type Issue = "gagne" | "perdu" | null;

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Marge signée, moins préparation et pertes, en écart à l'objectif de la direction. */
  objectif: number;
  signe: number;
  prepa: number;
  pertes: number;
  balmes: Attribution;
  ardanel: Issue;
  garon: Issue;
  /** Vauclair : l'accord aligné, conservé, ou perdu. */
  vauclair: "aligne" | "reste" | "part";
  /** Les jours de surcharge des semaines 2 à 5, ceux qui pèsent sur le dossier. */
  surchargeDossier: number;
  surchargeTotale: number;
  chargeMax: number;
  devisMax: number;
  connaitSites: boolean;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const d1 = chemin[D.tri];
  const d6 = chemin[D.vauclair] ?? 3;
  const semaines: (Semaine | null)[] = [null];
  const surcharges: number[] = [0];
  const total = totalBalmes(chemin);
  let devis = DEVIS_DEPART;
  let prepa = 0;
  const perteEnquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let pertes = 0;
  let signe = 0;
  let faitBalmes = 0;
  let cumulAvant = 0;
  let balmes: Attribution | null = null;
  let ardanel: Issue = null;
  let garon: Issue = null;
  let vauclair: Trimestre["vauclair"] = "reste";
  const cuivre = h.imprevus.reduce((s, i) => s + (i.imprevu.effet.balmes ?? 0), 0);
  const somme = (de: number, a: number) => surcharges.slice(de, a + 1).reduce((s, x) => s + x, 0);

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const debut = h.imprevus.filter((i) => i.semaine === w);

    // Ce que l'équipe peut donner cette semaine.
    let capacite = CAPACITE;
    for (const a of actifs) capacite -= a.imprevu.effet.jours ?? 0;
    if (d1 === 3 && w >= 2 && w <= 5) capacite += 2; // Le renfort, qui apprend le métier.

    // Ce qu'on lui demande : les comptes en place, et les offres.
    const offres = joursBalmes(chemin, w) + joursArdanel(chemin, w) + joursGaron(chemin, w);
    let autres = 0;
    if (d6 === 1 && w === 11) autres += 2; // La revue d'affaires Vauclair, les devis rattrapés.
    if (balmes?.gagne && w >= 11) autres += 1.5; // Le démarrage du marché.
    const demande = COURANT * h.courant[w]! + offres + autres;
    const surcharge = Math.max(0, demande - capacite);
    surcharges.push(surcharge);
    devis = Math.max(2, devis + 4 * surcharge - 2 * Math.max(0, capacite - demande));
    faitBalmes += w <= 5 ? joursBalmes(chemin, w) : 0;

    // Ce que la semaine coûte.
    let depense = offres * COUT_JOUR;
    if (w === 2 && repondArdanel(chemin)) depense += COUTS.echantillons;
    if (w === 3 && repondGaron(chemin)) depense += COUTS.dossierGaron;
    if (w === 4 && chemin[D.memoire] === 3) depense += COUTS.cabinet;
    if (d1 === 3 && w >= 2 && w <= 5) depense += COUTS.renfort;
    let perte = w === 1 ? perteEnquete : 0;
    perte += surcharge * PERTE_SURCHARGE;
    for (const a of debut) perte += a.imprevu.effet.marge ?? 0;

    // Ce que la semaine rapporte : les attributions.
    let gain = 0;
    if (w === 6 && repondArdanel(chemin)) {
      const chance = CHANCE_ARDANEL * qualite(somme(1, 3));
      ardanel = h.uArdanel < chance ? "gagne" : "perdu";
      if (ardanel === "gagne") gain += VAN_ARDANEL;
    }
    if (w === 8 && repondGaron(chemin)) {
      const soin = chemin[D.tri] === 1 ? 0.95 : 1;
      const chance = CHANCE_GARON * soin * (0.6 + 0.4 * qualite(somme(2, 4)));
      garon = h.uGaron < chance ? "gagne" : "perdu";
      if (garon === "gagne") gain += VAN_GARON;
    }
    if (w === 10) {
      balmes = attribuer(chemin, graine, somme(2, 5), cuivre);
      if (balmes.gagne) gain += balmes.valeur;
    }
    if (w === 12) {
      const reste = h.uVauclair < chanceQueVauclairReste(d6, somme(1, 10));
      vauclair = d6 === 0 ? "aligne" : reste ? "reste" : "part";
      perte += perteVauclair(d6, reste);
    }

    prepa += depense;
    pertes += perte;
    signe += gain;
    const cumul = signe - prepa - pertes;
    semaines.push({
      charge: demande / capacite,
      surcharge,
      devis,
      dossier: Math.min(1, faitBalmes / total),
      prepa,
      signe,
      pertes,
      contribution: cumul - cumulAvant,
      cumul,
    });
    cumulAvant = cumul;
  }

  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: signe - prepa - pertes - OBJECTIF,
    signe,
    prepa,
    pertes,
    balmes: balmes!,
    ardanel,
    garon,
    vauclair,
    surchargeDossier: somme(2, 5),
    surchargeTotale: somme(1, 13),
    chargeMax: Math.max(...pleines.map((s) => s.charge)),
    devisMax: Math.max(...pleines.map((s) => s.devis)),
    connaitSites: connaitSites(chemin, graine),
  };
}

/** Ce qui s'est passé pendant des semaines : attributions, erreur, Vauclair, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const premiereSurcharge = t.semaines.findIndex((s, w) => w >= 2 && w <= 5 && s!.surcharge >= 2);
  return {
    surcharge: premiereSurcharge > 0 && dans(premiereSurcharge) ? premiereSurcharge : null,
    ardanel: dans(6) ? t.ardanel : null,
    garon: dans(8) ? t.garon : null,
    erreur: t.balmes.erreur && dans(8),
    balmes: dans(10) ? t.balmes : null,
    surcout: t.balmes.gagne && !t.connaitSites && dans(11),
    vauclair: chemin[D.vauclair] !== 0 && dans(12) ? t.vauclair : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureOffres {
  charge: number | null;
  devis: number | null;
  dossier: number | null;
  prepa: number | null;
  signe: number | null;
  /** Ce que les messages et les sources lisent, sans que le tableau de bord l'affiche. */
  cumul: number | null;
  surchargeTotale: number | null;
  /** 1 : l'équipe sait que les logements seront occupés. */
  sites: number | null;
  /** Le prix remis et la marge nette qu'il laisse si Balmes est gagné, coût du service compris. */
  prix: number | null;
  marge: number | null;
  /** Balmes : 1 gagné, 0 perdu, null pas encore attribué. */
  balmes: number | null;
  technique: number | null;
  note: number | null;
  rang: number | null;
}

/** Ce que Vincent lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureOffres {
  if (semaine === 0) {
    return {
      charge: 0.72,
      devis: DEVIS_DEPART,
      dossier: 0,
      prepa: 0,
      signe: 0,
      cumul: 0,
      surchargeTotale: 0,
      sites: 0,
      prix: 1,
      marge: MARGE_TARIF,
      balmes: null,
      technique: null,
      note: null,
      rang: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const attribue = semaine >= 10;
  return {
    charge: s.charge,
    devis: s.devis,
    dossier: s.dossier,
    prepa: s.prepa,
    signe: s.signe,
    cumul: s.cumul,
    surchargeTotale: t.semaines.slice(1, semaine + 1).reduce((x, w) => x + w!.surcharge, 0),
    sites: semaine >= 3 && t.connaitSites ? 1 : 0,
    prix: t.balmes.prix,
    marge: t.balmes.marge,
    balmes: attribue ? (t.balmes.gagne ? 1 : 0) : null,
    technique: attribue ? t.balmes.technique : null,
    note: attribue ? t.balmes.note : null,
    rang: attribue ? t.balmes.rang : null,
  };
}
