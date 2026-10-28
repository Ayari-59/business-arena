import { auCentime } from "./amortissement";
import { coutsDeLaQualite } from "./capacite";
import {
  DELAI_DE_LA_COMMANDE_PUBLIQUE,
  DELAI_MAXIMAL_CONVENU,
  DERNIER_RANG,
  JOURS_DE_L_ANNEE_BANCAIRE,
  JOURS_DE_L_ANNEE_CIVILE,
  JOURS_DU_TRIMESTRE,
  MAJORATION_DU_TAUX_BCE,
  MULTIPLE_DU_TAUX_LEGAL,
  PREMIER_RANG,
  TAUX_D_INTERET_LEGAL,
  TAUX_DE_REFINANCEMENT_BCE,
  type ClienteleDuBatiment,
  type CodeDeClienteleDuBatiment,
  type CodeDOffre,
  type FicheDeLAffaire,
  type FicheDesDelaisDeNova,
  type FicheDuBatiment,
  type NatureDesOperations,
  type OffreDeFournisseur,
  type RegimeDExigibilite,
} from "./delais-et-tva";
import { coutDeLAvance, escompteMaximal, facture, tauxAnnuelDeLEscompte } from "./facture";
import type { FicheDeLaCapacite } from "./nova-capacite";

/**
 * LE MODÈLE DES DÉLAIS ET DE LA TVA DU COURS : MARTEL & FILS (la TVA et son exigibilité), NOVA en
 * N + 1 (ses fournisseurs, CampusTech, sa banque) et ATLAS CONSEIL (une affaire et ses conditions).
 *
 * Tout se calcule sur la fiche (monde/delais-et-tva.ts), en fonctions pures : la même fiche et les
 * mêmes leviers donnent toujours les mêmes chiffres. Chaque fonction qu'un curseur ou un laboratoire
 * lira prend ses leviers en paramètres, avec la fiche pour valeur de départ.
 *
 *   1. LES ENCOURS AU DÉLAI : une créance ou une dette à la clôture = flux du trimestre × délai ÷ 90
 *      (un flux régulier) ; ce qui s'encaisse dans un trimestre ; le délai moyen ; les factures
 *      mensuelles encore dues à la clôture (un client facturé une fois par mois).
 *   2. LA TVA ET SON EXIGIBILITÉ : la TVA collectée sur les ventes facturées (débits) ou sur les
 *      encaissements ; la TVA déductible (achats et immobilisations, des biens) ; la TVA nette, le
 *      crédit imputé sur la déclaration suivante, la TVA à payer ; l'année, et les deux régimes face
 *      à face.
 *   3. LA TVA DANS LA TRÉSORERIE : à une clôture, la TVA que les clients doivent, celle que
 *      l'entreprise a déjà déclarée pour eux (la TVA avancée), celle qu'elle doit au fournisseur et à
 *      l'État ; ce que la TVA laisse en trésorerie, et qui fait crédit à qui ; les flux de TVA d'un
 *      trimestre ; ce qu'un délai de plus accordé à une clientèle coûte, selon le régime.
 *   4. LES FOURNISSEURS : une offre gardée toute l'année (le coût des composants, le stock, la dette,
 *      les ruptures), face à l'offre habituelle, en résultat et en trésorerie ; le délai que le
 *      fournisseur allonge ; l'escompte qu'il offre, ramené à un taux annuel.
 *   5. LE CRÉDIT CLIENT ET LE RETARD : la facture de CampusTech, les créances et le délai moyen d'un
 *      trimestre (au délai réel, 60 jours), le coût du crédit accordé, et le retard SUPPOSÉ (si
 *      CampusTech payait 20 jours après l'échéance, l'hypothèse du chapitre) face aux pénalités qu'il
 *      ouvrirait.
 *   6. L'ESCOMPTE, L'AFFACTURAGE ET LE DÉCOUVERT : leur coût, les jours de découvert qui valent un
 *      escompte, une facture mobilisée de trois façons, l'escompte à chaque trimestre face au
 *      découvert qu'il évite.
 *   7. L'AFFAIRE AUX CONDITIONS : la facture (remise, escompte, TVA), la marge et la part qu'une remise
 *      en cède, le coût du crédit accordé, l'escompte face au financement, la contrepartie d'une
 *      remise.
 *
 * CONVENTIONS : les montants sont au centime ; un nom dit HT ou TTC. Les intérêts (découvert,
 * escompte, affacturage, crédit) se comptent sur 360 jours, les pénalités de retard sur 365. Les taux
 * et les parts ne sont pas arrondis (c'est l'affichage qui arrondit). Un écart négatif est une perte.
 */

const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const TRIMESTRES = [1, 2, 3, 4] as const;

// ═════════════════════════════════════════════════════════════════════════════
// 1. LES ENCOURS AU DÉLAI
// ═════════════════════════════════════════════════════════════════════════════

/** Ce qui reste dû à la clôture d'un flux régulier payé à un délai : flux × min(délai, jours) ÷ jours. */
export function encoursAuDelai(flux: number, delai: number, jours: number = JOURS_DU_TRIMESTRE) {
  return auCentime((flux * Math.min(Math.max(delai, 0), jours)) / jours);
}

/** Ce qui s'encaisse dans un trimestre : le flux du trimestre moins sa part due, plus la part due du trimestre d'avant. */
export function encaisseDansLeTrimestre(flux: number, fluxPrecedent: number, delai: number, jours: number = JOURS_DU_TRIMESTRE) {
  return auCentime(flux - encoursAuDelai(flux, delai, jours) + encoursAuDelai(fluxPrecedent, delai, jours));
}

/** Le délai moyen de paiement : encours ÷ flux du trimestre × 90. */
export const delaiMoyen = (encours: number, flux: number, jours: number = JOURS_DU_TRIMESTRE) => (flux > 0 ? (encours / flux) * jours : 0);

/**
 * Les factures mensuelles encore dues au jour de la clôture : celles émises le `jourDeFacturation` de
 * chaque mois (en mois de 30 jours) dont l'échéance tombe après la clôture. À 80 jours, une facture
 * du 20 est encore due 80 jours ; au 90e jour du trimestre, les factures des jours 20, 50 et 80.
 */
export function facturesMensuellesEnCours(jourDeFacturation: number, delai: number, jourDeCloture: number = JOURS_DU_TRIMESTRE, joursDuMois = 30) {
  let n = 0;
  for (let jour = jourDeFacturation; jour <= jourDeCloture; jour += joursDuMois) if (jour + delai > jourDeCloture) n++;
  for (let jour = jourDeFacturation - joursDuMois; jour + delai > jourDeCloture; jour -= joursDuMois) n++;
  return n;
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. LA TVA ET SON EXIGIBILITÉ (MARTEL & FILS)
// ═════════════════════════════════════════════════════════════════════════════

/** Les leviers de la TVA du bâtiment. Chacun a sa valeur de départ dans la fiche. */
export interface LeviersDeLaTva {
  /** Le régime d'exigibilité (par défaut, celui de la fiche : les encaissements). */
  regime: RegimeDExigibilite;
  tauxDeTva: number;
  /** Le délai de paiement de chaque clientèle, en jours (au plus 90 : un trimestre). */
  delais: Partial<Record<CodeDeClienteleDuBatiment, number>>;
  /** Le délai de paiement du négoce de matériaux. */
  delaiFournisseur: number;
  /** Compter l'investissement du printemps (par défaut, oui). */
  avecLInvestissement: boolean;
}

const indiceDuRang = (rang: number) => {
  if (!Number.isInteger(rang) || rang < PREMIER_RANG || rang > DERNIER_RANG) throw new Error(`Pas de trimestre de rang ${rang}`);
  return rang - PREMIER_RANG;
};

const regimeDe = (f: FicheDuBatiment, l: Partial<LeviersDeLaTva>) => l.regime ?? f.declaration.regime;
const tauxDe = (f: FicheDuBatiment, l: Partial<LeviersDeLaTva>) => l.tauxDeTva ?? f.tauxDeTva;
const delaiDe = (g: ClienteleDuBatiment, l: Partial<LeviersDeLaTva>) => l.delais?.[g.code] ?? g.delai;
const delaiDuFournisseur = (f: FicheDuBatiment, l: Partial<LeviersDeLaTva>) => l.delaiFournisseur ?? f.fournisseur.delai;

/** Les immobilisations livrées dans un trimestre, hors taxes (l'investissement du printemps, si on le compte). */
export function investissementsDuTrimestre(f: FicheDuBatiment, rang: number, leviers: Partial<LeviersDeLaTva> = {}) {
  indiceDuRang(rang);
  if (leviers.avecLInvestissement === false) return 0;
  return somme(f.investissements.filter((x) => x.rang === rang).map((x) => x.montantHT));
}

/**
 * Les travaux d'un trimestre, clientèle par clientèle : facturés (hors taxes), encaissés dans le
 * trimestre (hors taxes : le prix, sans sa TVA), et la créance qui reste à la clôture (HT et TTC).
 * Les encaissements demandent le trimestre d'avant : ils ne se calculent qu'à partir du rang 0.
 */
export function ventesDuTrimestre(f: FicheDuBatiment, rang: number, leviers: Partial<LeviersDeLaTva> = {}) {
  const i = indiceDuRang(rang);
  const t = tauxDe(f, leviers);
  const clienteles = f.clienteles.map((g) => {
    const delai = delaiDe(g, leviers);
    const ventesHT = g.ventesHT[i]!;
    const creanceHT = encoursAuDelai(ventesHT, delai);
    return {
      code: g.code,
      nom: g.nom,
      delai,
      ventesHT,
      encaisseHT: i === 0 ? null : encaisseDansLeTrimestre(ventesHT, g.ventesHT[i - 1]!, delai),
      creanceHT,
      creanceTTC: auCentime(creanceHT * (1 + t)),
    };
  });
  const encaissements = clienteles.map((x) => x.encaisseHT);
  return {
    rang,
    clienteles,
    ventesHT: somme(clienteles.map((x) => x.ventesHT)),
    encaissementsHT: encaissements.some((x) => x === null) ? null : auCentime(somme(encaissements as number[])),
    creancesHT: auCentime(somme(clienteles.map((x) => x.creanceHT))),
    creancesTTC: auCentime(somme(clienteles.map((x) => x.creanceTTC))),
  };
}

/**
 * La déclaration d'un trimestre (rang 0 à 4) au régime choisi.
 *   - TVA collectée = base × taux. La base : les travaux facturés du trimestre (les débits), ou les
 *     encaissements du trimestre (les encaissements).
 *   - TVA déductible = (achats de matériaux + immobilisations) × taux : des biens, déductibles à la
 *     livraison, quel que soit le régime des ventes.
 *   - TVA nette = collectée − déductible. Le crédit du trimestre d'avant s'impute dessus : TVA à payer
 *     = nette − crédit reçu, ou zéro ; ce qui reste du crédit passe à la déclaration suivante.
 */
export function declarationDuTrimestre(f: FicheDuBatiment, rang: number, leviers: Partial<LeviersDeLaTva> = {}): DeclarationDeTva {
  if (rang < 0) throw new Error("La première déclaration de la fiche est celle du rang 0");
  const v = ventesDuTrimestre(f, rang, leviers);
  const t = tauxDe(f, leviers);
  const regime = regimeDe(f, leviers);
  const base = regime === "debits" ? v.ventesHT : v.encaissementsHT!;
  const achatsHT = f.achatsHT[indiceDuRang(rang)]!;
  const immobilisationsHT = investissementsDuTrimestre(f, rang, leviers);
  const collectee = auCentime(base * t);
  const deductible = auCentime((achatsHT + immobilisationsHT) * t);
  const nette = auCentime(collectee - deductible);
  const creditRecu = rang === 0 ? f.declaration.creditDOuverture : declarationDuTrimestre(f, rang - 1, leviers).creditAReporter;
  const apresCredit = auCentime(nette - creditRecu);
  return {
    rang,
    regime,
    taux: t,
    ventesHT: v.ventesHT,
    encaissementsHT: v.encaissementsHT,
    baseHT: base,
    achatsHT,
    immobilisationsHT,
    collectee,
    deductible,
    nette,
    creditRecu,
    aPayer: Math.max(0, apresCredit),
    creditAReporter: Math.max(0, -apresCredit),
  };
}

export interface DeclarationDeTva {
  rang: number;
  regime: RegimeDExigibilite;
  taux: number;
  ventesHT: number;
  encaissementsHT: number | null;
  /** Ce sur quoi la TVA est collectée : les ventes (débits) ou les encaissements, hors taxes. */
  baseHT: number;
  achatsHT: number;
  immobilisationsHT: number;
  collectee: number;
  deductible: number;
  /** Collectée − déductible ; négative, la TVA du trimestre fait un crédit. */
  nette: number;
  /** Le crédit du trimestre d'avant, imputé sur cette déclaration. */
  creditRecu: number;
  /** Ce que l'entreprise versera à l'État au trimestre suivant. */
  aPayer: number;
  /** Le crédit qui passe à la déclaration suivante. */
  creditAReporter: number;
}

/**
 * L'année N déclarée : la déclaration du quatrième trimestre de N − 1 (payée au premier trimestre de
 * N), puis les quatre de N. Versée dans l'année = ce qu'on paie aux trimestres 1 à 4, la TVA des rangs
 * 0 à 3 ; due au bilan du 31 décembre = la TVA à payer du quatrième trimestre (et le crédit qui
 * reste, s'il y en a un, est une créance sur l'État).
 */
export function declarationsDeLAnnee(f: FicheDuBatiment, leviers: Partial<LeviersDeLaTva> = {}) {
  const ouverture = declarationDuTrimestre(f, 0, leviers);
  const trimestres = TRIMESTRES.map((r) => declarationDuTrimestre(f, r, leviers));
  const t4 = trimestres[3]!;
  return {
    regime: regimeDe(f, leviers),
    ouverture,
    trimestres,
    collecteeDeLAnnee: auCentime(somme(trimestres.map((x) => x.collectee))),
    deductibleDeLAnnee: auCentime(somme(trimestres.map((x) => x.deductible))),
    netteDeLAnnee: auCentime(somme(trimestres.map((x) => x.nette))),
    verseeDansLAnnee: auCentime(ouverture.aPayer + somme(trimestres.slice(0, 3).map((x) => x.aPayer))),
    dueAuBilan: t4.aPayer,
    creditAuBilan: t4.creditAReporter,
    /** Les trimestres dont la TVA déductible dépasse la collectée. */
    trimestresEnCredit: trimestres.filter((x) => x.nette < 0).map((x) => x.rang),
  };
}

/** Les deux régimes face à face, trimestre par trimestre : la TVA nette et la TVA à payer, et leurs écarts (encaissements − débits). */
export function comparerLesRegimes(f: FicheDuBatiment, leviers: Partial<Omit<LeviersDeLaTva, "regime">> = {}) {
  const debits = declarationsDeLAnnee(f, { ...leviers, regime: "debits" });
  const encaissements = declarationsDeLAnnee(f, { ...leviers, regime: "encaissements" });
  return {
    debits,
    encaissements,
    ecartsDeTvaNette: TRIMESTRES.map((_, i) => auCentime(encaissements.trimestres[i]!.nette - debits.trimestres[i]!.nette)),
    ecartsDeTvaAPayer: TRIMESTRES.map((_, i) => auCentime(encaissements.trimestres[i]!.aPayer - debits.trimestres[i]!.aPayer)),
    ecartDeLAnnee: auCentime(encaissements.netteDeLAnnee - debits.netteDeLAnnee),
  };
}

/**
 * Le versement qui suit, face au dernier : la TVA à payer d'un trimestre (versée au suivant) moins celle
 * du trimestre d'avant (versée pendant ce trimestre). Positif : le prochain versement est plus lourd.
 */
export function versementSuivant(f: FicheDuBatiment, rang: number, leviers: Partial<LeviersDeLaTva> = {}) {
  const ici = declarationDuTrimestre(f, rang, leviers);
  const avant = declarationDuTrimestre(f, rang - 1, leviers);
  const ecart = auCentime(ici.aPayer - avant.aPayer);
  return { ici, avant, ecart, verdict: (ecart > 0 ? "plus-lourd" : ecart < 0 ? "plus-leger" : "egal") as "plus-lourd" | "plus-leger" | "egal" };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA TVA DANS LA TRÉSORERIE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Qui finance la TVA que les clients n'ont pas encore payée et que l'entreprise a déjà déclarée : « personne »
 * quand il n'y en a pas (le régime des encaissements), « l-etat » quand la TVA due à l'État la couvre,
 * « le-fournisseur » quand il faut aussi la TVA due au fournisseur, « l-entreprise » quand la TVA
 * retire de l'argent de sa trésorerie.
 */
export type QuiFaitCredit = "personne" | "l-etat" | "le-fournisseur" | "l-entreprise";

/**
 * La TVA à la clôture d'un trimestre (rang 0 à 4).
 *   - Dans les créances TTC, la TVA des clients : créances HT × taux. Au régime des débits, elle est
 *     déjà déclarée : l'entreprise l'AVANCE. Au régime des encaissements, elle n'est pas encore due.
 *   - Dans les dettes fournisseurs TTC (achats × délai ÷ 90), la TVA déjà déduite et pas encore payée.
 *   - La dette envers l'État : la TVA à payer du trimestre, moins le crédit qui reste (une créance).
 *   - Ce que la TVA laisse en trésorerie = dette envers l'État + TVA des dettes fournisseurs − TVA
 *     avancée pour les clients. Négatif, elle en retire.
 */
export function tvaALaCloture(f: FicheDuBatiment, rang: number, leviers: Partial<LeviersDeLaTva> = {}) {
  const t = tauxDe(f, leviers);
  const regime = regimeDe(f, leviers);
  const v = ventesDuTrimestre(f, rang, leviers);
  const d = declarationDuTrimestre(f, rang, leviers);
  const tvaDesCreances = auCentime(v.creancesHT * t);
  const tvaAvancee = regime === "debits" ? tvaDesCreances : 0;
  const dettesHT = encoursAuDelai(f.achatsHT[indiceDuRang(rang)]!, delaiDuFournisseur(f, leviers));
  const tvaDesDettes = auCentime(dettesHT * t);
  const detteEtat = auCentime(d.aPayer - d.creditAReporter);
  const effet = auCentime(detteEtat + tvaDesDettes - tvaAvancee);
  const quiFaitCredit: QuiFaitCredit =
    effet < 0 ? "l-entreprise" : tvaAvancee === 0 ? "personne" : detteEtat >= tvaAvancee ? "l-etat" : "le-fournisseur";
  return {
    rang,
    regime,
    creancesHT: v.creancesHT,
    creancesTTC: v.creancesTTC,
    tvaDesCreances,
    tvaAvancee,
    dettesHT,
    dettesTTC: auCentime(dettesHT * (1 + t)),
    tvaDesDettes,
    detteEtat,
    effet,
    quiFaitCredit,
  };
}

/**
 * Les flux de TVA d'un trimestre (rang 1 à 4), tels que le budget de trésorerie les cache : la TVA
 * encaissée des clients (dans leurs paiements TTC), la TVA payée au négoce et sur les immobilisations
 * (dans les paiements TTC), la TVA versée à l'État (la TVA à payer du trimestre d'avant). Solde =
 * encaissée − payée − versée : c'est de combien ce que la TVA laisse en trésorerie a bougé.
 */
export function fluxDeTvaDuTrimestre(f: FicheDuBatiment, rang: number, leviers: Partial<LeviersDeLaTva> = {}) {
  if (rang < 1) throw new Error("Les flux d'un trimestre demandent le trimestre d'avant");
  const t = tauxDe(f, leviers);
  const v = ventesDuTrimestre(f, rang, leviers);
  const i = indiceDuRang(rang);
  const encaissementsTTC = auCentime(v.encaissementsHT! * (1 + t));
  const achatsPayesHT = encaisseDansLeTrimestre(f.achatsHT[i]!, f.achatsHT[i - 1]!, delaiDuFournisseur(f, leviers));
  const immobilisationsHT = investissementsDuTrimestre(f, rang, leviers);
  const paiementsTTC = auCentime((achatsPayesHT + immobilisationsHT) * (1 + t));
  const tvaEncaissee = auCentime(v.encaissementsHT! * t);
  const tvaPayee = auCentime((achatsPayesHT + immobilisationsHT) * t);
  const tvaVersee = declarationDuTrimestre(f, rang - 1, leviers).aPayer;
  return {
    rang,
    encaissementsTTC,
    paiementsTTC,
    tvaEncaissee,
    tvaPayee,
    tvaVersee,
    solde: auCentime(tvaEncaissee - tvaPayee - tvaVersee),
    avant: tvaALaCloture(f, rang - 1, leviers).effet,
    apres: tvaALaCloture(f, rang, leviers).effet,
  };
}

/** Le délai le plus long que la loi permet à une clientèle du bâtiment : 30 jours pour une collectivité, 60 entre professionnels. */
export const delaiLegalDe = (code: CodeDeClienteleDuBatiment) => (code === "collectivites" ? DELAI_DE_LA_COMMANDE_PUBLIQUE : DELAI_MAXIMAL_CONVENU.joursDeLaFacture);

/**
 * Un délai de plus accordé à une clientèle dès janvier, au régime choisi.
 *   - À la clôture du quatrième trimestre : la créance en plus = ventes du trimestre × jours en plus ÷
 *     90 (HT et TTC), et la TVA qu'elle contient. Au régime des débits, cette TVA est déjà déclarée :
 *     l'entreprise l'avance pour ses clients. Au régime des encaissements, elle ne l'est pas.
 *   - Ce que l'entreprise finance en plus, une fois la TVA réglée : la créance TTC (débits) ou HT
 *     (encaissements).
 *   - Le coût de l'année, au taux du découvert : ventes de l'année (TTC ou HT) × jours en plus ÷ 360 ×
 *     taux (un flux régulier, attendu plus longtemps).
 *   - Ce que la TVA laisse en trésorerie au 31 décembre, avec et sans le délai.
 */
export function delaiEnPlus(f: FicheDuBatiment, code: CodeDeClienteleDuBatiment, joursEnPlus: number, leviers: Partial<LeviersDeLaTva> & { tauxDuDecouvert?: number } = {}) {
  const g = f.clienteles.find((x) => x.code === code);
  if (!g) throw new Error(`Pas de clientèle ${code}`);
  const t = tauxDe(f, leviers);
  const regime = regimeDe(f, leviers);
  const delai = delaiDe(g, leviers);
  const nouveauDelai = delai + joursEnPlus;
  const avec: Partial<LeviersDeLaTva> = { ...leviers, delais: { ...leviers.delais, [code]: nouveauDelai } };
  const ventesT4HT = g.ventesHT[indiceDuRang(4)]!;
  const creanceEnPlusHT = auCentime(encoursAuDelai(ventesT4HT, nouveauDelai) - encoursAuDelai(ventesT4HT, delai));
  const tvaEnPlus = auCentime(creanceEnPlusHT * t);
  const ventesDeLAnneeHT = somme(TRIMESTRES.map((r) => g.ventesHT[indiceDuRang(r)]!));
  const baseDeLAnnee = regime === "debits" ? auCentime(ventesDeLAnneeHT * (1 + t)) : ventesDeLAnneeHT;
  const taux = leviers.tauxDuDecouvert ?? f.tauxDuDecouvert;
  return {
    clientele: g.nom,
    regime,
    delai,
    nouveauDelai,
    depasseLeDelaiLegal: nouveauDelai > delaiLegalDe(code),
    ventesT4HT,
    creanceEnPlusHT,
    creanceEnPlusTTC: auCentime(creanceEnPlusHT * (1 + t)),
    tvaEnPlus,
    tvaAvanceeEnPlus: regime === "debits" ? tvaEnPlus : 0,
    financeEnPlus: regime === "debits" ? auCentime(creanceEnPlusHT * (1 + t)) : creanceEnPlusHT,
    ventesDeLAnneeHT,
    coutDeLAnnee: coutDeLAvance(baseDeLAnnee, taux, joursEnPlus),
    effetSans: tvaALaCloture(f, 4, leviers).effet,
    effetAvec: tvaALaCloture(f, 4, avec).effet,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LES FOURNISSEURS (NOVA EN N + 1)
// ═════════════════════════════════════════════════════════════════════════════

export const offreDe = (f: FicheDesDelaisDeNova, code: CodeDOffre): OffreDeFournisseur => {
  const o = f.offres.find((x) => x.code === code);
  if (!o) throw new Error(`Pas d'offre ${code}`);
  return o;
};

/** La marge sur coût variable d'une enceinte avec une offre : prix − composants − autres coûts variables. */
export const margeUnitaireAvec = (f: FicheDesDelaisDeNova, prixDesComposantsHT: number) => auCentime(f.prixHT - prixDesComposantsHT - f.autresCoutsVariablesHT);

/** Les leviers d'une offre. Chacun a sa valeur de départ dans l'offre de la fiche. */
export interface LeviersDeLOffre {
  prixHT: number;
  delaiDePaiement: number;
  joursDeStock: number;
  risqueDeRupture: number;
  tauxDuDecouvert: number;
  /** Compter dans le résultat le gain de qualité d'une offre qui baisse le taux de défaut (il faut alors la fiche de capacité). */
  qualite: FicheDeLaCapacite | null;
}

/**
 * Une offre gardée toute l'année N + 1, trimestre par trimestre. La consommation est celle des ventes
 * du plan (un jeu par enceinte). Le stock de fin de trimestre = consommation × jours de stock ÷ 90, au
 * prix de l'offre (HT) ; les achats = consommation + variation du stock (le stock part de zéro au
 * 1er janvier, celui de l'offre habituelle) ; les dettes = achats × délai ÷ 90 (HT et TTC). Sur
 * l'année : le coût des composants consommés, les ruptures espérées (4 × risque), les ventes et la
 * marge qu'elles font perdre en moyenne.
 */
export function anneeAvecUneOffre(f: FicheDesDelaisDeNova, code: CodeDOffre, leviers: Partial<LeviersDeLOffre> = {}) {
  const o = offreDe(f, code);
  const prix = leviers.prixHT ?? o.prixHT;
  const delai = leviers.delaiDePaiement ?? o.delaiDePaiement;
  const joursDeStock = leviers.joursDeStock ?? o.joursDeStock;
  const risque = leviers.risqueDeRupture ?? o.risqueDeRupture;
  let stockAvant = 0;
  const trimestres = f.ventes.map((consommation, i) => {
    const stockEnJeux = (consommation * joursDeStock) / JOURS_DU_TRIMESTRE;
    const stockHT = auCentime(stockEnJeux * prix);
    const achatsHT = auCentime(consommation * prix + stockHT - stockAvant);
    stockAvant = stockHT;
    const dettesHT = encoursAuDelai(achatsHT, delai);
    return { trimestre: i + 1, consommation, stockEnJeux, stockHT, achatsHT, dettesHT, dettesTTC: auCentime(dettesHT * (1 + f.tauxDeTva)) };
  });
  const fin = trimestres.at(-1)!;
  const consommation = somme(f.ventes);
  const marge = margeUnitaireAvec(f, prix);
  const rupturesEsperees = trimestres.length * risque;
  const ventesPerdues = rupturesEsperees * o.ventesPerduesParRupture;
  const gainDeQualite =
    leviers.qualite && o.baisseDuTauxDeDefaut > 0
      ? auCentime(coutsDeLaQualite(leviers.qualite).totalAvecLesVentesPerdues - coutsDeLaQualite(leviers.qualite, { baisseDuTaux: o.baisseDuTauxDeDefaut }).totalAvecLesVentesPerdues)
      : 0;
  return {
    offre: o,
    prixHT: prix,
    delai,
    joursDeStock,
    risque,
    trimestres,
    consommation,
    coutDesComposantsHT: auCentime(consommation * prix),
    achatsHT: auCentime(somme(trimestres.map((x) => x.achatsHT))),
    stockHT: fin.stockHT,
    dettesHT: fin.dettesHT,
    dettesTTC: fin.dettesTTC,
    margeUnitaire: marge,
    rupturesEsperees,
    ventesPerdues,
    margePerdue: auCentime(ventesPerdues * marge),
    gainDeQualite,
  };
}

/**
 * Une offre face à l'habituelle, sur l'année N + 1, hors taxes (la TVA des achats se déduit : elle ne
 * change que d'un mois le moment où l'argent sort).
 *   - L'économie = coût des composants consommés avec l'habituelle − avec l'offre (négative : un
 *     surcoût). L'écart de résultat (avant impôt) = économie − écart de marge perdue par les ruptures
 *     (+ le gain de qualité, s'il est compté).
 *   - L'écart de trésorerie au 31 décembre = écart de résultat − écart de stock + écart de dettes : le
 *     stock en plus est de l'argent déjà sorti, la dette en plus de l'argent pas encore sorti.
 *   - Le besoin de financement en plus (stock en plus − dettes en plus), et ce qu'il coûte sur un an au
 *     taux du découvert.
 */
export function comparerAvecLHabituelle(f: FicheDesDelaisDeNova, code: CodeDOffre, leviers: Partial<LeviersDeLOffre> = {}, leviersDeLHabituelle: Partial<LeviersDeLOffre> = {}) {
  const habituelle = anneeAvecUneOffre(f, f.offreHabituelle, { qualite: leviers.qualite ?? null, ...leviersDeLHabituelle });
  const offre = anneeAvecUneOffre(f, code, leviers);
  const economie = auCentime(habituelle.coutDesComposantsHT - offre.coutDesComposantsHT);
  const ecartDeResultat = auCentime(economie - (offre.margePerdue - habituelle.margePerdue) + (offre.gainDeQualite - habituelle.gainDeQualite));
  const ecartDeStock = auCentime(offre.stockHT - habituelle.stockHT);
  const ecartDeDettes = auCentime(offre.dettesHT - habituelle.dettesHT);
  const besoinEnPlus = auCentime(ecartDeStock - ecartDeDettes);
  const taux = leviers.tauxDuDecouvert ?? f.banque.tauxDuDecouvert;
  const coutDuBesoin = auCentime(besoinEnPlus * taux);
  return {
    habituelle,
    offre,
    economie,
    ecartDeMargePerdue: auCentime(offre.margePerdue - habituelle.margePerdue),
    ecartDeResultat,
    ecartDeStock,
    ecartDeDettes,
    ecartDeTresorerie: auCentime(ecartDeResultat - ecartDeStock + ecartDeDettes),
    besoinEnPlus,
    coutDuBesoin,
    resultatApresFinancement: auCentime(ecartDeResultat - coutDuBesoin),
  };
}

/** Les trois offres face à l'habituelle : la meilleure en résultat, la meilleure en trésorerie au 31 décembre. */
export function choisirUneOffre(f: FicheDesDelaisDeNova, leviers: Partial<LeviersDeLOffre> = {}) {
  const offres = f.offres.map((o) => comparerAvecLHabituelle(f, o.code, leviers));
  const meilleure = (cle: "ecartDeResultat" | "ecartDeTresorerie" | "resultatApresFinancement") => offres.reduce((m, x) => (x[cle] > m[cle] ? x : m)).offre.offre.code;
  return {
    offres,
    meilleureEnResultat: meilleure("ecartDeResultat"),
    meilleureEnTresorerie: meilleure("ecartDeTresorerie"),
    meilleureApresFinancement: meilleure("resultatApresFinancement"),
  };
}

/**
 * Le fournisseur habituel allonge son délai de quelques jours, ses prix inchangés. La dette du
 * 31 décembre grossit de achats du quatrième trimestre × jours en plus ÷ 90 (HT et TTC) : autant
 * d'argent encore en caisse. Ce crédit en plus évite, sur un an, achats de l'année × jours en plus ÷
 * 360 × taux du découvert. Au-delà de 60 jours, le délai n'est plus permis.
 */
export function delaiFournisseurAllonge(f: FicheDesDelaisDeNova, joursEnPlus: number, leviers: Partial<Pick<LeviersDeLOffre, "tauxDuDecouvert">> = {}) {
  const o = offreDe(f, f.offreHabituelle);
  const avant = anneeAvecUneOffre(f, o.code);
  const apres = anneeAvecUneOffre(f, o.code, { delaiDePaiement: o.delaiDePaiement + joursEnPlus });
  const taux = leviers.tauxDuDecouvert ?? f.banque.tauxDuDecouvert;
  const achatsT4HT = avant.trimestres.at(-1)!.achatsHT;
  return {
    offre: o,
    nouveauDelai: o.delaiDePaiement + joursEnPlus,
    permis: o.delaiDePaiement + joursEnPlus <= DELAI_MAXIMAL_CONVENU.joursDeLaFacture,
    avant,
    apres,
    creditEnPlusHT: encoursAuDelai(achatsT4HT, joursEnPlus),
    creditEnPlusTTC: encoursAuDelai(auCentime(achatsT4HT * (1 + f.tauxDeTva)), joursEnPlus),
    coutEviteParAn: coutDeLAvance(avant.achatsHT, taux, joursEnPlus),
  };
}

/**
 * L'escompte qu'un fournisseur offre pour un paiement plus rapide (taux t pour payer à `jours` au lieu
 * du délai) : son taux annuel, t ÷ (1 − t) × 360 ÷ (délai − jours) (monde/facture.ts). Le refuser,
 * c'est emprunter à ce taux au fournisseur ; s'il dépasse le découvert, mieux vaut payer tôt sur le
 * découvert. Sur l'année : l'escompte gagné, le découvert qu'il faut payer pour avancer le paiement,
 * le gain net, et la dette du 31 décembre qui fond.
 */
export function escompteDuFournisseur(f: FicheDesDelaisDeNova, code: CodeDOffre, leviers: Partial<Pick<LeviersDeLOffre, "tauxDuDecouvert">> = {}) {
  const o = offreDe(f, code);
  if (!o.escompte) return null;
  const taux = leviers.tauxDuDecouvert ?? f.banque.tauxDuDecouvert;
  const avance = o.delaiDePaiement - o.escompte.jours;
  const annee = anneeAvecUneOffre(f, code);
  const escompteGagne = auCentime(annee.achatsHT * o.escompte.taux);
  const coutDeLAvanceDeLAnnee = coutDeLAvance(auCentime(annee.achatsHT - escompteGagne), taux, avance);
  const tauxAnnuel = tauxAnnuelDeLEscompte(o.escompte.taux, avance);
  return {
    offre: o,
    joursDAvance: avance,
    tauxAnnuel,
    tauxDuDecouvert: taux,
    prendre: tauxAnnuel > taux,
    escompteGagne,
    coutDeLAvance: coutDeLAvanceDeLAnnee,
    gainNet: auCentime(escompteGagne - coutDeLAvanceDeLAnnee),
    detteQuiFondHT: auCentime(annee.dettesHT - encoursAuDelai(annee.trimestres.at(-1)!.achatsHT, o.escompte.jours)),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LE CRÉDIT CLIENT ET LE RETARD (NOVA ET CAMPUSTECH)
// ═════════════════════════════════════════════════════════════════════════════

/** La facture mensuelle de CampusTech (monde/facture.ts) : 320 enceintes à 59 € HT, sans remise ni escompte, TVA 20 %. */
export function factureDeCampusTech(f: FicheDesDelaisDeNova) {
  const x = facture({ quantite: f.campustech.enceintesParFacture, prixUnitaire: f.prixHT, reductions: [], escompte: 0, tauxDeTva: f.tauxDeTva });
  return { ht: x.netFinancier, tva: x.tva, ttc: x.netAPayer };
}

/**
 * Les créances à la clôture d'un trimestre de N + 1. Les particuliers paient comptant ; CampusTech est
 * facturée le 20 de chaque mois : ses factures encore dues à la clôture (au délai choisi, par défaut le
 * délai réel, 60 jours : CampusTech paie à l'échéance) font la créance, toutes taxes comprises. Le délai moyen des clients = créances ÷ chiffre
 * d'affaires TTC du trimestre × 90.
 */
export function creancesDuTrimestre(f: FicheDesDelaisDeNova, trimestre: 1 | 2 | 3 | 4, leviers: Partial<{ delai: number }> = {}) {
  const delai = leviers.delai ?? f.campustech.delaiReel;
  const fct = factureDeCampusTech(f);
  const enceintes = f.ventes[trimestre - 1]!;
  const caHT = auCentime(enceintes * f.prixHT);
  const caTTC = auCentime(caHT * (1 + f.tauxDeTva));
  const campustechHT = auCentime(3 * fct.ht);
  const factures = facturesMensuellesEnCours(f.campustech.jourDeFacturation, delai);
  const creancesTTC = auCentime(factures * fct.ttc);
  return {
    trimestre,
    delai,
    enceintes,
    caHT,
    caTTC,
    campustechHT,
    particuliersHT: auCentime(caHT - campustechHT),
    factures,
    creancesTTC,
    delaiMoyen: delaiMoyen(creancesTTC, caTTC),
  };
}

/** Le taux annuel des pénalités de retard : le taux de la BCE majoré de 10 points, ou le plancher de 3 fois le taux d'intérêt légal. */
export function tauxDesPenalites(base: "bce" | "taux-legal" = "bce") {
  return base === "bce" ? TAUX_DE_REFINANCEMENT_BCE.taux + MAJORATION_DU_TAUX_BCE : MULTIPLE_DU_TAUX_LEGAL * TAUX_D_INTERET_LEGAL.professionnels;
}

/** Les leviers du retard de CampusTech. */
export interface LeviersDuRetard {
  delaiConvenu: number;
  delaiReel: number;
  /** Le taux auquel NOVA finance l'attente : le découvert par défaut ; le placement si son compte est créditeur. */
  tauxDeFinancement: number;
  base: "bce" | "taux-legal";
}

/**
 * Le crédit que NOVA fait à CampusTech, et le retard qu'elle prendrait. Par défaut, le paiement est
 * celui de l'hypothèse du chapitre, 20 jours après l'échéance (f.campustech.delaiSiRetard) : dans le
 * monde du cours, CampusTech paie à l'heure, et `{ delaiReel: f.campustech.delaiReel }` le montre sans
 * retard. NOVA vend des biens : la TVA est déjà due, elle
 * finance chaque facture TOUTES TAXES COMPRISES.
 *   - Par facture : le crédit convenu coûte TTC × taux × délai convenu ÷ 360 ; le retard, TTC × taux ×
 *     jours de retard ÷ 360. Les pénalités qu'il ouvre = TTC × taux des pénalités × jours de retard ÷
 *     365 ; s'y ajoute l'indemnité de 40 €.
 *   - Sur l'année : 12 factures.
 *   - À chaque clôture : la créance en plus que le retard laisse (les factures en plus encore dues).
 */
export function retardDeCampusTech(f: FicheDesDelaisDeNova, leviers: Partial<LeviersDuRetard> = {}) {
  const delaiConvenu = leviers.delaiConvenu ?? f.campustech.delaiConvenu;
  const delaiReel = leviers.delaiReel ?? f.campustech.delaiSiRetard;
  const taux = leviers.tauxDeFinancement ?? f.banque.tauxDuDecouvert;
  const base = leviers.base ?? f.penalites.base;
  const fct = factureDeCampusTech(f);
  const jours = Math.max(0, delaiReel - delaiConvenu);
  const facturesParAn = 12;
  const tauxPenalites = tauxDesPenalites(base);
  const penalitesParFacture = auCentime((fct.ttc * tauxPenalites * jours) / JOURS_DE_L_ANNEE_CIVILE);
  const indemniteParFacture = jours > 0 ? f.penalites.indemnite : 0;
  const coutDuRetardParFacture = coutDeLAvance(fct.ttc, taux, jours);
  const facturesConvenu = facturesMensuellesEnCours(f.campustech.jourDeFacturation, delaiConvenu);
  const facturesReel = facturesMensuellesEnCours(f.campustech.jourDeFacturation, delaiReel);
  return {
    facture: fct,
    delaiConvenu,
    delaiReel,
    joursDeRetard: jours,
    enRetard: jours > 0,
    delaiConvenuPermis: delaiConvenu <= DELAI_MAXIMAL_CONVENU.joursDeLaFacture,
    tauxDeFinancement: taux,
    tauxDesPenalites: tauxPenalites,
    coutDuCreditConvenuParFacture: coutDeLAvance(fct.ttc, taux, delaiConvenu),
    coutDuRetardParFacture,
    penalitesParFacture,
    indemniteParFacture,
    facturesParAn,
    coutDuCreditConvenuParAn: auCentime(facturesParAn * coutDeLAvance(fct.ttc, taux, delaiConvenu)),
    coutDuRetardParAn: auCentime(facturesParAn * coutDuRetardParFacture),
    penalitesParAn: auCentime(facturesParAn * penalitesParFacture),
    indemnitesParAn: facturesParAn * indemniteParFacture,
    reclamableParAn: auCentime(facturesParAn * (penalitesParFacture + indemniteParFacture)),
    facturesEnCoursConvenu: facturesConvenu,
    facturesEnCoursReel: facturesReel,
    creanceEnPlusTTC: auCentime((facturesReel - facturesConvenu) * fct.ttc),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. L'ESCOMPTE, L'AFFACTURAGE ET LE DÉCOUVERT
// ═════════════════════════════════════════════════════════════════════════════

/** L'escompte d'un montant pendant j jours : montant × taux × j ÷ 360. */
export const coutDeLEscompte = (montant: number, taux: number, jours: number) => coutDeLAvance(montant, taux, jours);

/** Le découvert d'un montant pendant j jours : montant × taux × j ÷ 360. */
export const coutDuDecouvert = (montant: number, taux: number, jours: number) => coutDeLAvance(montant, taux, jours);

/** L'affacturage d'un montant payé j jours plus tard : montant × commission + montant × taux de financement × j ÷ 360. */
export const coutDeLAffacturage = (montant: number, commission: number, taux: number, jours: number) => auCentime(auCentime(montant * commission) + coutDeLAvance(montant, taux, jours));

/**
 * Les jours de découvert qui coûtent autant qu'un escompte du même montant : jours d'escompte × taux de
 * l'escompte ÷ taux du découvert. Un escompte paie tous ses jours ; le découvert, seulement ceux où le
 * compte est débiteur. Moins de jours de découvert que cela : le découvert coûte moins.
 */
export const joursDeDecouvertQuiValentLEscompte = (joursDEscompte: number, tauxDeLEscompte: number, tauxDuDecouvert: number) => (joursDEscompte * tauxDeLEscompte) / tauxDuDecouvert;

/**
 * Une facture de CampusTech mobilisée de trois façons, de sa date à son paiement réel (par défaut,
 * celui de l'hypothèse du retard, f.campustech.delaiSiRetard).
 *   - L'escompte, sauf bonne fin : la banque l'avance jusqu'à l'échéance convenue ; CampusTech ne paie
 *     pas à l'échéance, la banque reprend la somme, et NOVA finance les jours de retard sur son
 *     découvert.
 *   - L'affacturage : le factor l'avance jusqu'au paiement réel (commission et financement), encaisse
 *     lui-même et garantit l'impayé.
 *   - Le découvert seul, jusqu'au paiement réel.
 */
export function mobiliserUneFacture(f: FicheDesDelaisDeNova, leviers: Partial<Pick<LeviersDuRetard, "delaiConvenu" | "delaiReel">> = {}) {
  const fct = factureDeCampusTech(f);
  const b = f.banque;
  const convenu = leviers.delaiConvenu ?? f.campustech.delaiConvenu;
  const reel = leviers.delaiReel ?? f.campustech.delaiSiRetard;
  const retard = Math.max(0, reel - convenu);
  const escompte = coutDeLEscompte(fct.ttc, b.escompte.taux, convenu);
  const retardAuDecouvert = coutDuDecouvert(fct.ttc, b.tauxDuDecouvert, retard);
  const escompteEtRetard = auCentime(escompte + retardAuDecouvert);
  const commission = auCentime(fct.ttc * b.affacturage.commission);
  const financement = coutDeLAvance(fct.ttc, b.affacturage.tauxDeFinancement, reel);
  const affacturage = auCentime(commission + financement);
  const decouvert = coutDuDecouvert(fct.ttc, b.tauxDuDecouvert, reel);
  const couts = { escompte: escompteEtRetard, affacturage, decouvert };
  const leMoinsCher = (Object.keys(couts) as (keyof typeof couts)[]).reduce((m, k) => (couts[k] < couts[m] ? k : m));
  return {
    facture: fct,
    convenu,
    reel,
    retard,
    escompte,
    retardAuDecouvert,
    escompteEtRetard,
    commission,
    financement,
    affacturage,
    decouvert,
    leMoinsCher,
    /** Ce que l'affacturage coûte de plus que l'escompte : le prix du recouvrement et de la garantie. */
    primeDeLAffacturage: auCentime(affacturage - escompteEtRetard),
  };
}

/**
 * Escompter à chaque trimestre les 3 factures de CampusTech (chacune jusqu'à son échéance convenue),
 * face au découvert qu'il évite (les besoins de trésorerie de N + 1). Puis la variante : escompter
 * seulement là où il faut, assez de factures pour couvrir le besoin, quand l'escompte coûte moins que
 * le découvert. L'encours escompté ne dépasse jamais le plafond de la banque : 2 factures à la fois.
 */
export function escompterChaqueTrimestre(f: FicheDesDelaisDeNova, leviers: Partial<{ tauxDeLEscompte: number; tauxDuDecouvert: number }> = {}) {
  const fct = factureDeCampusTech(f);
  const b = f.banque;
  const tauxE = leviers.tauxDeLEscompte ?? b.escompte.taux;
  const tauxD = leviers.tauxDuDecouvert ?? b.tauxDuDecouvert;
  const jours = f.campustech.delaiConvenu;
  const parFacture = coutDeLEscompte(fct.ttc, tauxE, jours);
  const encoursEscompte = auCentime(facturesMensuellesEnCours(f.campustech.jourDeFacturation, jours) * fct.ttc);
  const trimestres = f.besoins.map((x) => {
    const decouvert = coutDuDecouvert(x.montant, tauxD, x.jours);
    const facturesNecessaires = x.montant > 0 ? Math.ceil(x.montant / fct.ttc - 1e-9) : 0;
    const escompteDuBesoin = auCentime(facturesNecessaires * parFacture);
    return {
      trimestre: x.trimestre,
      besoin: x.montant,
      joursDeDecouvert: x.jours,
      escompteDeTout: auCentime(3 * parFacture),
      decouvert,
      facturesNecessaires,
      escompteDuBesoin,
      mieux: (x.montant === 0 ? "rien" : escompteDuBesoin < decouvert ? "escompte" : "decouvert") as "rien" | "escompte" | "decouvert",
    };
  });
  const escompteDeLAnnee = auCentime(somme(trimestres.map((x) => x.escompteDeTout)));
  const decouvertEvite = auCentime(somme(trimestres.map((x) => x.decouvert)));
  const auMieux = auCentime(somme(trimestres.map((x) => (x.mieux === "escompte" ? x.escompteDuBesoin : x.decouvert))));
  return {
    parFacture,
    encoursEscompte,
    dansLePlafond: encoursEscompte <= b.escompte.plafondTTC,
    trimestres,
    escompteDeLAnnee,
    decouvertEvite,
    surcout: auCentime(escompteDeLAnnee - decouvertEvite),
    verdict: (escompteDeLAnnee < decouvertEvite ? "evite-le-decouvert" : "inutile") as "evite-le-decouvert" | "inutile",
    auMieux,
    joursQuiValentLEscompte: joursDeDecouvertQuiValentLEscompte(jours, tauxE, tauxD),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. L'AFFAIRE AUX CONDITIONS (ATLAS CONSEIL)
// ═════════════════════════════════════════════════════════════════════════════

/** Les leviers de l'affaire. Chacun a sa valeur de départ dans la fiche. */
export interface LeviersDeLAffaire {
  journees: number;
  prixHT: number;
  coutVariableHT: number;
  remise: number;
  tauxDEscompte: number;
  joursDEscompte: number;
  delai: number;
  tauxDeFinancement: number;
  nature: NatureDesOperations;
}

/**
 * L'affaire, de la facture à sa rentabilité.
 *   - La facture (monde/facture.ts) : brut, remise, net commercial, escompte, net financier, TVA.
 *   - La marge sur coût variable au prix catalogue, après la remise, et la part que la remise en cède.
 *   - Le crédit accordé : le net commercial attendu `délai` jours, financé au taux du découvert. Pour
 *     des services, la TVA n'est due qu'à l'encaissement : le cabinet finance le HORS TAXES ; pour des
 *     biens, il financerait le TTC. Le résultat de l'affaire = marge après remise − coût du crédit.
 *   - Si le client prend l'escompte : il paie le net financier à `jours d'escompte` ; le résultat =
 *     marge après remise − escompte − crédit de ces jours.
 *   - L'escompte face au financement : son taux annuel (t ÷ (1 − t) × 360 ÷ (délai − jours)) ; le délai
 *     où l'escompte coûte autant que le crédit, en raisonnant comme le chapitre (escompte = net
 *     commercial × taux × délai ÷ 360 : t × 360 ÷ taux) ; l'escompte le plus fort qui ne coûte pas
 *     plus que le découvert.
 *   - La contrepartie : les journées à vendre au prix remisé pour garder la marge du prix catalogue
 *     (à la journée supérieure).
 */
export function affaireAuxConditions(a: FicheDeLAffaire, leviers: Partial<LeviersDeLAffaire> = {}) {
  const journees = leviers.journees ?? a.journees;
  const prix = leviers.prixHT ?? a.prixHT;
  const cv = leviers.coutVariableHT ?? a.coutVariableHT;
  const remise = leviers.remise ?? a.remise;
  const tEscompte = leviers.tauxDEscompte ?? a.escompte.taux;
  const joursDEscompte = leviers.joursDEscompte ?? a.escompte.jours;
  const delai = leviers.delai ?? a.delai;
  const taux = leviers.tauxDeFinancement ?? a.tauxDeFinancement;
  const nature = leviers.nature ?? a.nature;
  const x = facture({ quantite: journees, prixUnitaire: prix, reductions: [{ nature: "remise", taux: remise }], escompte: tEscompte, tauxDeTva: a.tauxDeTva });
  const sansEscompte = facture({ quantite: journees, prixUnitaire: prix, reductions: [{ nature: "remise", taux: remise }], escompte: 0, tauxDeTva: a.tauxDeTva });
  const coutsVariables = auCentime(journees * cv);
  const margeCatalogue = auCentime(journees * (prix - cv));
  const marge = auCentime(x.netCommercial - coutsVariables);
  const margeCedee = auCentime(margeCatalogue - marge);
  const tvaAvancee = nature === "biens";
  const baseDuCredit = tvaAvancee ? sansEscompte.netAPayer : x.netCommercial;
  const coutDuCredit = coutDeLAvance(baseDuCredit, taux, delai);
  const baseAvecEscompte = tvaAvancee ? x.netAPayer : x.netFinancier;
  const coutDuCreditAvecEscompte = coutDeLAvance(baseAvecEscompte, taux, joursDEscompte);
  const prixRemise = auCentime(prix * (1 - remise));
  const margeParJourneeRemisee = auCentime(prixRemise - cv);
  const journeesPourLaMemeMarge = margeParJourneeRemisee > 0 ? Math.ceil(margeCatalogue / margeParJourneeRemisee - 1e-9) : null;
  return {
    client: a.client,
    journees,
    prixHT: prix,
    coutVariableHT: cv,
    remise,
    tauxDEscompte: tEscompte,
    joursDEscompte,
    delai,
    tauxDeFinancement: taux,
    facture: x,
    netAPayerSansEscompte: sansEscompte.netAPayer,
    coutsVariables,
    margeCatalogue,
    marge,
    margeCedee,
    partDeLaMargeCedee: margeCatalogue > 0 ? margeCedee / margeCatalogue : 0,
    baseDuCredit,
    coutDuCredit,
    resultat: auCentime(marge - coutDuCredit),
    coutDuCreditAvecEscompte,
    resultatAvecEscompte: auCentime(marge - x.escompte - coutDuCreditAvecEscompte),
    tauxAnnuelDeLEscompte: delai > joursDEscompte ? tauxAnnuelDeLEscompte(tEscompte, delai - joursDEscompte) : null,
    delaiOuLEscompteVautLeCredit: (tEscompte * JOURS_DE_L_ANNEE_BANCAIRE) / taux,
    escompteMaximal: delai > joursDEscompte ? escompteMaximal(taux, delai - joursDEscompte) : null,
    prixRemise,
    margeParJourneeRemisee,
    journeesPourLaMemeMarge,
    journeesEnPlus: journeesPourLaMemeMarge === null ? null : journeesPourLaMemeMarge - journees,
    delaiPermis: delai <= DELAI_MAXIMAL_CONVENU.joursDeLaFacture,
  };
}

