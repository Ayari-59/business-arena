/**
 * LE BUDGET QUI NE TIENT PAS — le modèle des services généraux.
 *
 * Un dépôt, quatre agences, un budget de fonctionnement trimestriel :
 * énergie, prestataire multiservices, maintenance des chariots et des quais,
 * réparations, petits travaux, fournitures. Treize semaines, six décisions.
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · L'ENGAGÉ N'EST PAS LE FACTURÉ. Une commande signée, une consommation
 *     d'énergie, une prestation réalisée coûtent le jour où elles ont lieu,
 *     pas le jour où la facture arrive : à la clôture, la comptabilité passe
 *     tout en charges, facturé ou non. L'outil de la direction financière
 *     projette sur les factures reçues ; il ne voit pas 40 k€ de travaux déjà
 *     signés. Le vrai dépassement est le double de celui qu'il annonce.
 *   · LES COUPES AVEUGLES SE PAIENT EN PANNES. Couper partout ou tout geler
 *     espace les visites préventives et retarde les réparations : les
 *     chariots tombent en panne quatre à six semaines plus tard, et une
 *     panne coûte sa réparation plus les heures où le quai attend. Ce qu'on
 *     a économisé sur la facture revient, plus cher, en arrêts.
 *   · REPRÉVOIR TÔT OUVRE DES ARBITRAGES. Annoncé en semaine 3, chiffres en
 *     main, le dépassement se discute : le relamping LED peut encore passer
 *     en investissement avant que sa facture n'arrive. Découvert à la
 *     pré-clôture, il se solde par un gel imposé en pleine saison.
 *
 * Le trimestre est jugé en euros : l'écart au budget de fonctionnement,
 * coûts des arrêts d'activité compris. Positif, le service est sous le budget.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le budget de fonctionnement du trimestre, tous postes confondus. */
export const BUDGET = 244500;
/** Le budget de chaque poste : par semaine, sauf les petits travaux, budgétés au trimestre. */
export const POSTES = {
  energie: 7000,
  prestataire: 3000,
  preventif: 2500,
  curatif: 2500,
  divers: 1500,
  travaux: 30000,
} as const;
/** Depuis la coupure de courant de décembre, la GTB du dépôt ne baisse plus rien la nuit. */
export const DERIVE_ENERGIE = 0.15;
/** La révision annuelle que le prestataire applique, et celle que son contrat plafonne. */
export const INDEXATION = { facturee: 0.074, contrat: 0.02 } as const;
/** Les heures de régie facturées en moyenne chaque semaine, dont 40 % ont un bon signé. */
export const REGIE = 700;
export const PART_REGIE_JUSTIFIEE = 0.4;
/** L'indexation excessive court depuis octobre : le trop-perçu du trimestre précédent. */
export const TROP_PERCU_AVANT = 2100;
/** Les petites demandes de travaux des sites, chaque semaine. */
export const DEMANDES = 400;
/** Les bons de commande signés avant le trimestre : montant, semaine de réalisation, de facture. */
export const ENGAGEMENTS = {
  auvent: { montant: 7000, realise: 3, facture: 4 },
  led: { montant: 24000, realise: 5, facture: 6 },
  marquage: { montant: 9000, realise: 7, facture: 8 },
} as const;
/** Trois commandes signées en semaine 9 (stores, peinture, signalétique), posées en fin de trimestre. */
export const COMMANDES_FIN = { signe: 9, s12: 2600, s13: 1600 } as const;
/** Pannes ordinaires attendues par semaine, préventif tenu ; la saison commence en semaine 10. */
export const PANNES = { base: 0.5, saison: 1.6, reparation: 3000 } as const;
export const SAISON = 10;
/** Ce que coûte une heure de quai ou de chariot à l'arrêt : préparateurs, camions, retards. */
export const HEURE = { normale: 180, saison: 260 } as const;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, des commandes partent sans passer par Samuel. */
export const PERTE_PAR_JOUR = 1500;

export const COUTS = {
  technicien: 1200,
  audit: 4500,
  appelDOffres: 2000,
  revision: 2500,
  location: 800,
  niveleur: 9000,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  economies: 0,
  reprevision: 1,
  energie: 2,
  prestataire: 3,
  pannes: 4,
  cloture: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 2, 3] as const;

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
  effet: { energie?: number; cout?: number; heures?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "froid",
    titre: "Vague de froid",
    de: "Kévin Da Silva",
    role: "Technicien de maintenance",
    texte:
      "Moins dix la nuit pendant deux semaines : les aérothermes du dépôt tournent sans arrêt, et la facture d'énergie suivra.",
    duree: 2,
    effet: { energie: 1.25 },
  },
  {
    id: "orage",
    titre: "Orage sur l'agence de Vénissieux",
    de: "Aurélie Cosson",
    role: "Cheffe d'agence, Vénissieux",
    texte:
      "L'orage de cette nuit a arraché une partie de la couverture du showroom. Le couvreur intervient en urgence : 4 800 €.",
    duree: 1,
    effet: { cout: 4800 },
  },
  {
    id: "controle",
    titre: "Contrôle des rayonnages",
    de: "Bureau de contrôle",
    role: "Vérification périodique",
    texte:
      "Deux échelles de rayonnage déformées au dépôt : remise en conformité obligatoire sous quinze jours, 3 500 €.",
    duree: 1,
    effet: { cout: 3500 },
  },
  {
    id: "effraction",
    titre: "Effraction au dépôt",
    de: "Bruno Ferrat",
    role: "Chef du dépôt de Corbas",
    texte:
      "Le portail a été forcé cette nuit. Rien de volé, mais il faut le réparer et renforcer le gardiennage deux semaines : 4 000 €.",
    duree: 1,
    effet: { cout: 4000 },
  },
  {
    id: "coupure",
    titre: "Coupure de courant à Corbas",
    de: "Bruno Ferrat",
    role: "Chef du dépôt de Corbas",
    texte:
      "Coupure de courant sur toute la zone industrielle : chargeurs arrêtés, chariots à plat. Le quai a attendu une demi-journée.",
    duree: 1,
    effet: { heures: 10 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

/** Une panne possible : elle tombe si `u` passe sous le risque de la semaine. */
interface Panne {
  u: number;
  /** Le coût de la réparation, rapporté à la moyenne. */
  cout: number;
  /** Les heures d'arrêt, avant tout ce qui les allonge ou les raccourcit. */
  heures: number;
}

interface Bruit {
  energie: number;
  regie: number;
  pannes: readonly Panne[];
}

/** Le nombre de pannes possibles par semaine : le risque se partage entre elles. */
const CRENEAUX = 5;
/** Même un parc maltraité ne tombe pas en panne plus de deux fois et demie par semaine en moyenne. */
const RISQUE_MAX = 2.5;

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La direction financière accepte-t-elle de passer le relamping en investissement ? */
  uDaf: number;
  /** Le prestataire, contesté, accepte-t-il ? */
  uPrestataire: number;
  /** Le niveleur du quai 2 lâche-t-il en semaine 8 ? */
  uNiveleur: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 2750159 + 17);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    const energie = Math.min(1.15, Math.max(0.88, 1 + 0.05 * gauss(r)));
    const regie = Math.min(1.5, Math.max(0.5, 1 + 0.25 * gauss(r)));
    const pannes: Panne[] = [];
    for (let k = 0; k < CRENEAUX; k += 1) {
      const u = r();
      const cout = Math.min(2.5, Math.max(0.4, Math.exp(0.4 * gauss(r) - 0.08)));
      // Une panne sur cinq attend une pièce : le chariot reste à l'arrêt un à deux jours.
      const longue = r() < 0.2;
      const heures = longue ? 10 + 14 * r() : 2 + 4 * r();
      pannes.push({ u, cout, heures });
    }
    semaines.push({ energie, regie, pannes });
  }
  const uDaf = r();
  const uPrestataire = r();
  const uNiveleur = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uDaf, uPrestataire, uNiveleur, imprevus };
  tirages.set(graine, h);
  return h;
}

/**
 * LE RELAMPING PASSE-T-IL EN INVESTISSEMENT ?
 *
 * Il le peut s'il est validé avant que la facture n'arrive, en semaine 6.
 * Avec le rapprochement engagé-facturé de la semaine 1, le dossier est prêt :
 * la direction financière accepte neuf fois sur dix. Sans lui, il faut tout
 * reconstituer, la pose finit avant le dossier, et elle refuse le plus
 * souvent.
 */
export function chanceDeCapitaliser(chemin: readonly number[]): number {
  if (chemin[D.reprevision] !== 0) return 0;
  return chemin[D.economies] === 2 ? 0.9 : 0.35;
}
export const ledCapitalise = (chemin: readonly number[], graine: number) =>
  hasard(graine).uDaf < chanceDeCapitaliser(chemin);

/** Ce que fait le prestataire quand on conteste ses factures, contrat en main. */
export type ReponsePrestataire = "accepte" | "partiel" | "braque";
export function reponseDuPrestataire(graine: number): ReponsePrestataire {
  const u = hasard(graine).uPrestataire;
  return u < 0.55 ? "accepte" : u < 0.8 ? "partiel" : "braque";
}

/** Le dépassement n'a pas été annoncé : la pré-clôture le découvre en semaine 10. */
export const surprise = (chemin: readonly number[]) =>
  chemin[D.reprevision] === 1 || chemin[D.reprevision] === 3;

/**
 * LE RISQUE QUE LE NIVELEUR DU QUAI 2 LÂCHE EN SEMAINE 8.
 *
 * Son vérin fuit depuis l'automne ; la visite préventive le surveille. Visites
 * espacées, il lâche une fois sur deux ; pièces d'usure gelées, plus d'une
 * fois sur trois ; préventif tenu, une fois sur dix.
 */
export function risqueNiveleur(chemin: readonly number[]): number {
  if (chemin[D.economies] === 0) return 0.5;
  if (chemin[D.economies] === 1) return 0.35;
  if (chemin[D.reprevision] === 2) return 0.3;
  return 0.1;
}
export const niveleurLache = (chemin: readonly number[], graine: number) =>
  hasard(graine).uNiveleur < risqueNiveleur(chemin);

export type Semaine = {
  /** Dépenses facturées depuis le début du trimestre. */
  facture: number;
  /** Commandes signées, consommations et prestations réalisées, pas encore facturées. */
  engage: number;
  /** L'écart au budget que projette l'outil de la direction financière, sur le facturé. */
  projection: number;
  /** Heures d'arrêt de chariots et de quais depuis le début du trimestre. */
  arrets: number;
  /** L'énergie consommée dans la semaine. */
  energie: number;
  /** Ce que le prestataire multiservices a réalisé dans la semaine, au prix qu'il facture. */
  prestation: number;
  /** Ce que la semaine a coûté : dépenses réalisées et heures d'arrêt. */
  depense: number;
  /** Les dépenses réalisées de la semaine, hors arrêts. */
  realise: number;
  pannes: number;
  heures: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget, arrêts compris : positif, le service est sous le budget. */
  objectif: number;
  /** Les dépenses réalisées du trimestre, facturées ou non. */
  depenses: number;
  /** Ce que les heures d'arrêt ont coûté. */
  coutArrets: number;
  pannes: number;
  heuresArret: number;
  /** Les factures non parvenues à la clôture : ce que la comptabilité passe en charges à payer. */
  nonFacture: number;
  energieMoyenne: number;
  /** L'énergie par semaine sur les quatre dernières semaines. */
  energieFin: number;
  /** Comment le dépassement est arrivé à la direction financière. */
  annonce: "tot" | "rallonge" | "surprise";
  ledCapitalise: boolean;
  prestataire: ReponsePrestataire | null;
  avoir: number;
  niveleur: boolean;
  surprise: boolean;
}

/** Une dépense : quand elle est engagée, réalisée, facturée — et, le cas échéant, annulée. */
interface Ligne {
  poste: "energie" | "prestataire" | "preventif" | "curatif" | "divers" | "travaux" | "autre";
  montant: number;
  signe: number;
  realise: number;
  facture: number;
  /** La semaine où la commande sort du trimestre (reportée, annulée, passée en investissement). */
  sortie?: number;
}

/**
 * Les factures mensuelles. Les contrats facturent en fin de mois (semaines 4,
 * 8, 12) ; l'énergie, la semaine qui suit le relevé (5, 9, 13). La
 * consommation de la semaine 13 sera facturée au trimestre suivant.
 */
const MOIS_ENERGIE = [5, 9, 13] as const;
const MOIS_CONTRATS = [4, 8, 12] as const;
/** La semaine où arrive la facture d'une consommation de la semaine w ; 99 : après la clôture. */
const factureEnergie = (w: number) => MOIS_ENERGIE.find((m) => m > w) ?? 99;
const factureContrat = (w: number) => MOIS_CONTRATS.find((m) => m >= w) ?? 99;

/** Le rythme des factures d'avant le trimestre, que l'outil de la DAF prolonge. */
const RYTHME_AVANT = {
  energie: POSTES.energie * (1 + DERIVE_ENERGIE),
  prestataire: POSTES.prestataire * (1 + INDEXATION.facturee) + REGIE,
  preventif: POSTES.preventif,
} as const;

/** L'écart au budget que l'outil de la direction financière annonce en semaine 0. */
export const PROJECTION_DEPART =
  BUDGET -
  SEMAINES * (RYTHME_AVANT.energie + RYTHME_AVANT.prestataire + RYTHME_AVANT.preventif) -
  SEMAINES * (POSTES.curatif + POSTES.divers) -
  POSTES.travaux;

/** Ce qui est engagé avant la première semaine : les trois bons de commande signés. */
export const ENGAGE_DEPART =
  ENGAGEMENTS.auvent.montant + ENGAGEMENTS.led.montant + ENGAGEMENTS.marquage.montant;

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const coupe = d1 === 0;
  const gel = d1 === 1;
  const analyse = d1 === 2;
  const coupeImposee = d2 === 2;
  const capitalise = ledCapitalise(chemin, graine);
  const pre = surprise(chemin);
  const niveleur = niveleurLache(chemin, graine);
  const prestataire = d4 === 0 ? reponseDuPrestataire(graine) : null;
  /** La semaine où les 10 % s'appliquent : dès la semaine 2, ou imposés en semaine 6. */
  const coupeDes = coupe ? 2 : coupeImposee ? 6 : 99;
  /** Les visites espacées usent le parc : les pannes suivent trois semaines plus tard. */
  const degradeDes = coupeDes + 3;

  const lignes: Ligne[] = [];
  const ajoute = (
    poste: Ligne["poste"],
    montant: number,
    realise: number,
    facture: number,
    signe = realise,
  ) => {
    if (montant !== 0) lignes.push({ poste, montant, signe, realise, facture });
  };

  // Les bons de commande signés avant le trimestre.
  const { auvent, led, marquage } = ENGAGEMENTS;
  lignes.push({ poste: "travaux", ...auvent, signe: 0 });
  lignes.push({ poste: "travaux", ...led, signe: 0, sortie: capitalise ? 4 : undefined });
  lignes.push({ poste: "travaux", ...marquage, signe: 0, sortie: analyse ? 2 : undefined });
  // Les trois commandes de fin de trimestre : jamais signées sous le gel, annulées par un gel tardif.
  if (!gel) {
    const annulee = pre ? 11 : d6 === 1 || d6 === 2 ? 12 : undefined;
    lignes.push({
      poste: "travaux",
      montant: COMMANDES_FIN.s12,
      signe: COMMANDES_FIN.signe,
      realise: 12,
      facture: 14,
      sortie: annulee,
    });
    lignes.push({
      poste: "travaux",
      montant: COMMANDES_FIN.s13,
      signe: COMMANDES_FIN.signe,
      realise: 13,
      facture: 15,
      sortie: annulee,
    });
  }
  if (jours > JOURS_SANS_PERTE) ajoute("autre", (jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR, 1, 3);

  const pannesParSemaine: number[] = [0];
  const heuresParSemaine: number[] = [0];
  const coutArretsParSemaine: number[] = [0];
  const energieParSemaine: number[] = [0];
  const prestationParSemaine: number[] = [0];
  let avoir = 0;
  let duPrestataire = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const saison = w >= SAISON;
    const gelTardif = pre && w >= 11;

    // L'énergie : la dérive de la GTB, la météo, et ce qu'on y fait.
    let derive = DERIVE_ENERGIE;
    if (d3 === 0 && w >= 6) derive = 0;
    if (d3 === 2 && w >= 11) derive = 0;
    let energie = POSTES.energie * (1 + derive) * n.energie;
    if (w >= coupeDes) energie *= 0.97;
    if (analyse && w >= 2) energie *= 0.98;
    if (d3 === 1 && w >= 6) energie *= 0.95;
    if (d3 === 2 && w >= 11) energie *= 0.97;
    for (const a of actifs) energie *= a.imprevu.effet.energie ?? 1;
    energieParSemaine.push(energie);
    ajoute("energie", energie, w, factureEnergie(w));

    // Le prestataire multiservices : un forfait mal indexé, et de la régie sans bon.
    let indexation: number = INDEXATION.facturee;
    let regie = REGIE * n.regie;
    let forfait: number = POSTES.prestataire;
    if (w >= coupeDes) forfait *= 0.92;
    if (w >= 8) {
      if (prestataire === "accepte" || prestataire === "partiel") {
        indexation = INDEXATION.contrat;
        regie *= PART_REGIE_JUSTIFIEE;
      }
      if (prestataire === "braque") regie = 0;
    }
    let prestation = forfait * (1 + indexation) + regie;
    if (d4 === 2 && w >= 8) prestation *= 0.95;
    if (w < 8) {
      duPrestataire +=
        forfait * (INDEXATION.facturee - INDEXATION.contrat) + regie * (1 - PART_REGIE_JUSTIFIEE);
    }
    prestationParSemaine.push(prestation);
    ajoute("prestataire", prestation, w, factureContrat(w));
    if (w === 8 && prestataire === "accepte") {
      avoir = duPrestataire + TROP_PERCU_AVANT;
      ajoute("prestataire", -avoir, 8, 8);
    }

    // Le préventif : un contrat de visites, que les coupes espacent et que la révision rattrape.
    let preventif: number = POSTES.preventif;
    if (w >= coupeDes) preventif *= 0.8;
    if (d5 === 0 && saison) preventif = POSTES.preventif;
    if (d6 === 2 && w >= 12) preventif *= 0.5;
    ajoute("preventif", preventif, w, factureContrat(w));

    // Les fournitures et les petites demandes des sites.
    let divers: number = POSTES.divers;
    let demandes: number = DEMANDES;
    if (w >= coupeDes) {
      divers *= 0.9;
      demandes *= 0.9;
    }
    if (analyse && w >= 2) demandes *= 0.6;
    if (gel && w >= 2) {
      divers *= 0.5;
      demandes = 0;
    }
    if (gelTardif || ((d6 === 1 || d6 === 2) && w >= 12)) {
      divers = Math.min(divers, POSTES.divers * 0.5);
      demandes = 0;
    }
    ajoute("divers", divers, w, w);
    ajoute("travaux", demandes, w, w + 2);

    // Ce que les décisions coûtent en elles-mêmes.
    if (d3 === 0 && w === 6) ajoute("autre", COUTS.technicien, w, w + 2);
    if (d3 === 2 && w === 6) ajoute("autre", COUTS.audit, w, w + 4);
    if (d4 === 1 && w === 9) ajoute("autre", COUTS.appelDOffres, w, w + 2);
    if (d5 === 0 && w === 10) ajoute("curatif", COUTS.revision, w, w + 2);
    if (d5 === 1 && saison) ajoute("autre", COUTS.location, w, w + 2);
    for (const a of actifs) {
      if (a.imprevu.effet.cout && w === a.semaine) ajoute("autre", a.imprevu.effet.cout, w, w + 2);
    }

    // Les pannes : le risque de la semaine, ce qui l'aggrave et ce qui le réduit.
    let risque = PANNES.base * (saison ? PANNES.saison : 1);
    let usure = 1;
    if (w >= degradeDes) usure *= 1.8;
    if (gel && w >= 4) usure *= 1.3;
    if (d5 === 0 && saison) usure = 0.5;
    if (gelTardif) usure *= 1.25;
    if (d5 === 3 && w >= 11) usure *= 1.5;
    if (d6 === 2 && w >= 12) usure *= 2.5;
    risque = borne(risque * usure, 0, RISQUE_MAX);
    let allonge = 1;
    if (gel && w >= 2) allonge = 1.5;
    if (gelTardif) allonge = Math.max(allonge, 1.6);
    if (d6 === 2 && w >= 12) allonge = Math.max(allonge, 1.5);
    let reparation: number = PANNES.reparation;
    if (d5 === 3 && saison) reparation *= 0.6;
    const tarif = saison ? HEURE.saison : HEURE.normale;

    let pannes = 0;
    let heures = 0;
    for (const p of n.pannes) {
      if (p.u >= risque / CRENEAUX) continue;
      pannes += 1;
      ajoute("curatif", reparation * p.cout, w, w + 2);
      let hp = p.heures * allonge;
      if (d5 === 1 && saison) hp = Math.min(hp, 2);
      heures += hp;
    }
    if (w === 8 && niveleur) {
      pannes += 1;
      ajoute("curatif", COUTS.niveleur, w, w + 2);
      heures += 24 * allonge;
    }
    // Le prestataire braqué n'intervient plus hors contrat : les portes de quai attendent.
    if (prestataire === "braque" && w >= 8 && w <= 12) heures += 16;
    // Le prestataire en préavis traîne sur chaque intervention.
    if (d4 === 1 && w >= 8) heures += 6;
    for (const a of actifs) heures += a.imprevu.effet.heures ?? 0;
    pannesParSemaine.push(pannes);
    heuresParSemaine.push(heures);
    coutArretsParSemaine.push(heures * tarif);
  }

  // Ce que chaque semaine montre : facturé, engagé, et la projection de l'outil de la DAF.
  const vivante = (l: Ligne) => l.sortie === undefined || l.sortie > l.realise;
  const semaines: (Semaine | null)[] = [null];
  let arrets = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const facturees = lignes.filter((l) => vivante(l) && l.facture <= w);
    const facture = facturees.reduce((s, l) => s + l.montant, 0);
    const engage = lignes
      .filter((l) => l.signe <= w && l.facture > w && (l.sortie === undefined || l.sortie > w))
      .reduce((s, l) => s + l.montant, 0);
    const realise = lignes
      .filter((l) => vivante(l) && l.realise === w)
      .reduce((s, l) => s + l.montant, 0);
    arrets += heuresParSemaine[w]!;
    semaines.push({
      facture,
      engage,
      projection: BUDGET - projeter(facturees, w),
      arrets,
      energie: energieParSemaine[w]!,
      prestation: prestationParSemaine[w]!,
      depense: realise + coutArretsParSemaine[w]!,
      realise,
      pannes: pannesParSemaine[w]!,
      heures: heuresParSemaine[w]!,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const depenses = pleines.reduce((s, x) => s + x.realise, 0);
  const coutArrets = coutArretsParSemaine.reduce((s, x) => s + x, 0);
  return {
    semaines,
    objectif: BUDGET - depenses - coutArrets,
    depenses,
    coutArrets,
    pannes: pleines.reduce((s, x) => s + x.pannes, 0),
    heuresArret: arrets,
    nonFacture: depenses - pleines[SEMAINES - 1]!.facture,
    energieMoyenne: pleines.reduce((s, x) => s + x.energie, 0) / SEMAINES,
    energieFin: pleines.slice(-4).reduce((s, x) => s + x.energie, 0) / 4,
    annonce: d2 === 0 ? "tot" : d2 === 2 ? "rallonge" : "surprise",
    ledCapitalise: capitalise,
    prestataire,
    avoir,
    niveleur,
    surprise: pre,
  };
}

/**
 * LA PROJECTION DE L'OUTIL DE LA DIRECTION FINANCIÈRE.
 *
 * Elle part des factures reçues. Les contrats mensuels sont prolongés au
 * rythme de leur dernière facture ; les réparations et les fournitures, au
 * rythme du budget ; les petits travaux, à ce qui reste de leur budget au
 * prorata des semaines restantes. Ce qu'elle ne voit pas : les commandes
 * signées qui n'ont pas encore de facture, ni ce qui est consommé depuis la
 * dernière facture d'un contrat qui dérive.
 */
function projeter(facturees: readonly Ligne[], w: number): number {
  const du = (poste: Ligne["poste"]) =>
    facturees.filter((l) => l.poste === poste).reduce((s, l) => s + l.montant, 0);
  let total = du("autre") + du("curatif") + du("divers");
  total += (SEMAINES - w) * (POSTES.curatif + POSTES.divers);
  // Les petits travaux : le reste du budget, au prorata des semaines restantes.
  const travaux = du("travaux");
  total += travaux + (Math.max(0, POSTES.travaux - travaux) * (SEMAINES - w)) / SEMAINES;
  const mensuels = [
    ["energie", MOIS_ENERGIE],
    ["prestataire", MOIS_CONTRATS],
    ["preventif", MOIS_CONTRATS],
  ] as const;
  for (const [poste, mois] of mensuels) {
    const recues = mois.filter((m) => m <= w);
    const derniere = recues.at(-1);
    const couvert = derniere === undefined ? 0 : poste === "energie" ? derniere - 1 : derniere;
    // La dernière facture, hors avoir : celle des quatre semaines qu'elle couvre.
    const rythme =
      derniere === undefined
        ? RYTHME_AVANT[poste]
        : facturees
            .filter((l) => l.poste === poste && l.facture === derniere && l.montant > 0)
            .reduce((s, l) => s + l.montant, 0) / 4;
    total += du(poste) + Math.max(0, SEMAINES - couvert) * rythme;
  }
  return total;
}

/** Ce qui s'est passé pendant des semaines : arbitrage, prestataire, niveleur, gel, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    reponseDaf: chemin[D.reprevision] === 0 && dans(5),
    niveleur: t.niveleur && dans(8),
    surprise: t.surprise && dans(10),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureBudget {
  facture: number | null;
  engage: number | null;
  projection: number | null;
  arrets: number | null;
  energie: number | null;
  /** Le budget au prorata des semaines écoulées. */
  budgetADate: number | null;
  /** Les pannes depuis le début du trimestre. */
  pannes: number | null;
  /** Les dernières factures mensuelles reçues, d'énergie et du prestataire. */
  factureEnergie: number | null;
  facturePrestataire: number | null;
}

/** Ce que Samuel lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureBudget {
  if (semaine === 0) {
    return {
      facture: 0,
      engage: ENGAGE_DEPART,
      projection: PROJECTION_DEPART,
      arrets: 0,
      energie: RYTHME_AVANT.energie,
      budgetADate: 0,
      pannes: 0,
      factureEnergie: null,
      facturePrestataire: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const ecoulees = t.semaines.slice(1, semaine + 1) as Semaine[];
  const pannes = ecoulees.reduce((x, w) => x + w.pannes, 0);
  /** La dernière facture mensuelle reçue : la somme des quatre semaines qu'elle couvre. */
  const derniere = (mois: readonly number[], decalage: number, cle: "energie" | "prestation") => {
    const m = mois.filter((x) => x <= semaine).at(-1);
    if (m === undefined) return null;
    const fin = m - decalage;
    return (t.semaines.slice(fin - 3, fin + 1) as Semaine[]).reduce((x, w) => x + w[cle], 0);
  };
  return {
    facture: s.facture,
    engage: s.engage,
    projection: s.projection,
    arrets: s.arrets,
    energie: s.energie,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    pannes,
    factureEnergie: derniere(MOIS_ENERGIE, 1, "energie"),
    facturePrestataire: derniere(MOIS_CONTRATS, 0, "prestation"),
  };
}
