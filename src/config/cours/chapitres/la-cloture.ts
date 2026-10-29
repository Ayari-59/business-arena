import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime, type Ecriture, type Ligne } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { coefficientDegressif, joursCompris, JOURS_DE_L_ANNEE, JOURS_DU_MOIS, type DateDuCours } from "../monde/amortissement";
import { cloture as clotureDuMonde, impotSurLesSocietes, interetsDuPlacement, type CodeDeTravail } from "../monde/cloture";
import { empruntALaCloture, interetsCourus } from "../monde/emprunt";
import { EXERCICES_DU_COURS, MOIS_DE_L_EXERCICE, type FicheDeLExercice } from "../monde/exercice-de-nova";
import { valoriserLeStock } from "../monde/stock";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA CLÔTURE (comptabilité générale, palier 3 ; BTS CG, DCG UE9, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le premier
 * exercice de NOVA a une fiche figée (monde/exercice-de-nova.ts), et la clôture se calcule par le
 * modèle du cours (monde/cloture.ts, avec monde/amortissement.ts, monde/stock.ts, monde/emprunt.ts).
 * Une seule NOVA, de sa création à sa clôture : le chapitre ne se joue que chez elle.
 *
 * L'objet : la balance avant inventaire au 31 décembre N, déjà passée au journal, puis les travaux
 * d'inventaire de ce chapitre, passés en écritures (la dotation aux amortissements de la ligne, les
 * intérêts courus du compte à terme, le stock final de composants, la facture non parvenue, les
 * intérêts courus de l'emprunt, enfin passés et non plus seulement expliqués), le résultat avant
 * impôt, l'impôt au taux réduit puis au taux normal, et le résultat net. Les travaux de prudence
 * (dépréciation, provision) et les régularisations (charge et produit constatés d'avance, facture à
 * établir) sont ceux des chapitres du palier suivant : le résultat de ce chapitre n'est pas encore
 * celui que NOVA arrêtera.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, resultat-provisoire, dotation, le-stock-final, l-impot (la formule ou le
 *     chemin est dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-stock
 *     puis le-laboratoire-des-travaux (le stock, la facture non parvenue et les intérêts courus
 *     manquent ; un levier à choix linéaire ou dégressif) avant le stock, la facture et les intérêts
 *     passés en écritures ; predire-l-impot puis le-taux-moyen (un curseur sur le résultat fiscal :
 *     l'impôt au barème face à 20 % du résultat) avant l-impot ; predire-le-placement puis
 *     le-taux-qui-paierait-l-emprunt (un curseur sur le taux du compte à terme) avant
 *     emprunter-pour-placer ;
 *   · autonome : interets-du-placement, la-facture-non-parvenue, les-interets-courus,
 *     resultat-avant-impot (ni formule ni chiffres à prendre ; le calcul de la correction montre
 *     le chemin) ;
 *   · expert : emprunter-pour-placer (une critique chiffrée de la trésorerie, au taux marginal),
 *     variante-degressive (une variante chiffrée : le résultat et l'impôt en dégressif),
 *     le-degressif-differe (la critique : l'impôt n'est que décalé), a-rebours (retrouver le stock
 *     et son coût unitaire à partir d'un autre résultat) ; puis la synthèse.
 *
 * Ce qui a disparu : la lecture de l'année de l'arène (c.annee, ses quatre trimestres), l'étape « Et
 * l'arène ? », l'étape de la perte (NOVA est en bénéfice), les étapes de stock initial (le stock de
 * composants part de zéro en décembre).
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/** Les travaux d'inventaire de ce chapitre, dans l'ordre où il les passe. */
export const TRAVAUX_DE_LA_CLOTURE: readonly CodeDeTravail[] = ["dotation", "interetsDuPlacement", "stock", "factureNonParvenue", "interetsCourus"];

/** Ceux du palier suivant : la prudence (« Dépréciations et provisions ») et les régularisations. */
export const TRAVAUX_DU_PALIER_SUIVANT: readonly CodeDeTravail[] = ["creanceDouteuse", "provision", "chargeConstateeDAvance", "factureAEtablir", "produitConstateDAvance"];

/**
 * LE COMPTE DU PLAN DU COURS pour un compte de la fiche : la TVA de décembre, liquidée au 4455 dans la
 * fiche, se tient au 44551 (TVA à décaisser, son sous-compte), le seul que le plan du cours connaisse.
 */
const VERS_LE_PLAN: Readonly<Record<string, string>> = { "4455": "44551" };

/** Les choix du levier du stock final, au laboratoire : oublié, au coût moyen (la méthode de la fiche), au dernier prix d'achat. */
export const CHOIX_DU_STOCK = { oublie: 0, coutMoyen: 1, dernierPrix: 2 } as const;
/** Les choix du levier de la facture non parvenue : oubliée, hors taxes avec sa TVA à part (juste), toute taxe comprise en charges (l'erreur). */
export const CHOIX_DE_LA_FACTURE = { oubliee: 0, horsTaxes: 1, tvaComprise: 2 } as const;
/** Les choix du levier des intérêts courus : oubliés, au prorata des jours (juste), l'échéance entière (l'erreur). */
export const CHOIX_DES_INTERETS = { oublies: 0, auProrata: 1, echeanceEntiere: 2 } as const;
/** Les deux modes d'amortissement du levier à choix. */
export const MODES_D_AMORTISSEMENT = { lineaire: 0, degressif: 1 } as const;

/** Le taux moyen d'impôt que cherche le curseur de l'impôt : un repère rond, sous le taux normal. */
export const TAUX_MOYEN_CHERCHE = 0.2;
/** La borne haute du curseur de l'impôt, en euros de résultat fiscal (la borne basse est le plafond du taux réduit, où l'impôt devient une droite). */
export const RESULTAT_MAXIMAL_DU_CURSEUR = 120_000;

/** La charge du pari sur l'impôt : une charge ronde de plus, pour lire la pente de l'impôt. */
export const CHARGE_DU_PARI = 1_000;

/** Le curseur du placement compte en points de base : 100 points de base font 1 %. */
export const POINTS_DE_BASE = 10_000;
/** La borne haute du curseur du placement : 6 %, au-dessus du taux de l'emprunt. */
export const TAUX_MAXIMAL_DU_CURSEUR = 600;

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS
// ─────────────────────────────────────────────────────────────────────────────

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
/** Un terme d'une somme : « + 13 500 € » ou « − 34 500 € ». */
const terme = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);
/** Une somme de termes signés, le premier sans « + ». */
const somme = (xs: readonly number[]) => xs.map((x, i) => (i === 0 ? eur(x) : terme(x))).join(" ");
/** Une date de la fiche, en mots : « 6 janvier », « 1er octobre », « 8 janvier N+1 ». */
export const dateDe = (d: DateDuCours) => `${d.jour === 1 ? "1er" : d.jour} ${MOIS_DE_L_EXERCICE[d.mois - 1]}${(d.exercice ?? 0) > 0 ? ` N+${d.exercice}` : ""}`;

/** La fiche de l'exercice du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLExercice => EXERCICES_DU_COURS[c.code]!;

/** Le solde d'un compte de la balance avant inventaire, débiteur positif. */
const soldeDe = (f: FicheDeLExercice, compte: string) => {
  const l = f.balanceAvantInventaire.find((x) => x.compte === compte)!;
  return auCentime(l.debit - l.credit);
};

// ─────────────────────────────────────────────────────────────────────────────
// LA CLÔTURE DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/** La clôture du chapitre : ses cinq travaux, l'impôt, et tout ce que ses étapes demandent. */
export function clotureDeNova(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const k = clotureDuMonde(f, { travauxOublies: TRAVAUX_DU_PALIER_SUIVANT });
  const montant = (code: CodeDeTravail) => k.travaux.find((t) => t.code === code)!.montant;
  const effet = (code: CodeDeTravail) => k.travaux.find((t) => t.code === code)!.effetSurLeResultat;

  // La balance : ses comptes de gestion.
  const charges = f.balanceAvantInventaire.filter((l) => l.compte.startsWith("6")).map((l) => ({ compte: l.compte, intitule: l.intitule, montant: auCentime(l.debit - l.credit) }));
  const ventes = -soldeDe(f, "701");
  const totalDesCharges = auCentime(charges.reduce((t, l) => t + l.montant, 0));

  // La dotation : linéaire, au prorata des jours de service.
  const annuite = auCentime(f.equipement.ht / f.equipement.dureeAns);
  const joursDeService = joursCompris(f.equipement.miseEnService, f.cloture);

  // Le compte à terme : ses intérêts courus depuis le dépôt.
  const joursDuPlacement = joursCompris(f.placement.date, f.cloture);

  // Le stock de décembre, au coût moyen pondéré de la période.
  const stock = valoriserLeStock(f.composantsDeDecembre, f.methodeDeStock);
  const peps = valoriserLeStock(f.composantsDeDecembre, "peps");

  // La livraison sans facture : l'entrée de décembre du jour de la facture non parvenue.
  const fnp = f.factureNonParvenue;
  const livraison = f.composantsDeDecembre.mouvements.find((m) => m.sens === "entree" && m.date.jour === fnp.livraison.jour && m.date.mois === fnp.livraison.mois)!;

  // Les intérêts courus de l'emprunt.
  const icne = interetsCourus(f.pret, f.cloture);
  const emprunt = empruntALaCloture(f.pret);

  // L'impôt.
  const impot = k.impot;
  const tauxMoyen = impot.impot / k.resultatAvantImpot;

  // Emprunter pour placer : ce que l'emprunt coûte sur l'exercice, ce que les mêmes fonds rapportent placés.
  const chargeDeLEmprunt = emprunt.chargeDInterets;
  const produitDesFondsPlaces = interetsDuPlacement(f.pret.capital, f.placement.tauxAnnuel, f.placement.date, f.cloture);
  const coutNetAvantImpot = auCentime(chargeDeLEmprunt - produitDesFondsPlaces);
  const coutNetApresImpot = auCentime(coutNetAvantImpot * (1 - f.impot.tauxNormal));
  // Le plus petit taux, en points de base, où les fonds placés paieraient l'emprunt.
  const tauxQuiPaieLEmprunt = Math.ceil((chargeDeLEmprunt * JOURS_DE_L_ANNEE * POINTS_DE_BASE) / (f.pret.capital * joursDuPlacement) - 1e-9);

  // Les variantes : le dégressif, et le stock au dernier prix (le PEPS ici).
  const kd = clotureDuMonde(f, { travauxOublies: TRAVAUX_DU_PALIER_SUIVANT, modeDAmortissement: "degressif" });
  const kp = clotureDuMonde(f, { travauxOublies: TRAVAUX_DU_PALIER_SUIVANT, methodeDeStock: "peps" });
  const dotationDegressive = kd.travaux.find((t) => t.code === "dotation")!.montant;

  // Le curseur de l'impôt : le résultat où l'impôt au barème atteint le taux moyen cherché.
  const b = f.impot;
  const resultatAuTauxMoyen = Math.ceil((b.plafondDuTauxReduit * (b.tauxNormal - b.tauxReduit)) / (b.tauxNormal - TAUX_MOYEN_CHERCHE) - 1e-9);

  return {
    f,
    k,
    charges,
    ventes,
    totalDesCharges,
    resultatDeLaBalance: k.resultatAvantInventaire,
    annuite,
    joursDeService,
    dotation: montant("dotation"),
    joursDuPlacement,
    placement: montant("interetsDuPlacement"),
    stock: {
      coutMoyen: stock.coutMoyenDePeriode,
      entrees: stock.entrees,
      sorties: stock.sorties,
      final: stock.final,
    },
    stockFinal: montant("stock"),
    fnp: { ht: f.factureNonParvenue.ht, tva: f.factureNonParvenue.tva, ttc: f.factureNonParvenue.ttc, quantite: livraison.quantite, prixUnitaire: livraison.prixUnitaire! },
    icne: {
      interetsDeLEcheance: icne.echeanceSuivante!.interets,
      capitalDu: icne.echeanceSuivante!.capitalDebut,
      depuis: icne.depuis!,
      echeance: icne.echeanceSuivante!.date,
      jours: icne.jours,
      joursDeLaPeriode: icne.joursDeLaPeriode,
      montant: montant("interetsCourus"),
    },
    effets: TRAVAUX_DE_LA_CLOTURE.map((code) => ({ code, effet: effet(code) })),
    effetNet: auCentime(k.resultatAvantImpot - k.resultatAvantInventaire),
    resultatAvantImpot: k.resultatAvantImpot,
    impot,
    tauxMoyen,
    resultatNet: k.resultatNet,
    tresorerie: auCentime(soldeDe(f, "512") + soldeDe(f, f.placement.compte)),
    interetsPayes: emprunt.interetsPayes,
    chargeDeLEmprunt,
    produitDesFondsPlaces,
    coutNetAvantImpot,
    coutNetApresImpot,
    tauxQuiPaieLEmprunt,
    resultatAuTauxMoyen,
    degressif: {
      dotation: dotationDegressive,
      coefficient: coefficientDegressif(f.equipement.dureeAns),
      /** Les mois comptés la première année : du 1er jour du mois de mise en service au 31 décembre. */
      mois: 12 - f.equipement.miseEnService.mois + 1,
      resultatAvantImpot: kd.resultatAvantImpot,
      impot: kd.impot.impot,
      impotEnMoins: auCentime(impot.impot - kd.impot.impot),
      dotationEnPlus: auCentime(dotationDegressive - montant("dotation")),
    },
    peps: {
      stock: peps.final.valeur,
      resultatAvantImpot: kp.resultatAvantImpot,
      ecart: auCentime(kp.resultatAvantImpot - k.resultatAvantImpot),
      coutUnitaire: auCentime(peps.final.valeur / peps.final.quantite),
    },
  };
}

export type ClotureDeNova = ReturnType<typeof clotureDeNova>;

/** Le laboratoire des travaux : le résultat et l'impôt pour une position des quatre leviers. */
export function laboratoireDesTravaux(x: ClotureDeNova, p: Readonly<Record<string, number>>) {
  const dotation = p.mode === MODES_D_AMORTISSEMENT.degressif ? x.degressif.dotation : x.dotation;
  const stock = p.stock === CHOIX_DU_STOCK.coutMoyen ? x.stockFinal : p.stock === CHOIX_DU_STOCK.dernierPrix ? x.peps.stock : 0;
  const facture = p.facture === CHOIX_DE_LA_FACTURE.horsTaxes ? x.fnp.ht : p.facture === CHOIX_DE_LA_FACTURE.tvaComprise ? x.fnp.ttc : 0;
  const interets = p.interets === CHOIX_DES_INTERETS.auProrata ? x.icne.montant : p.interets === CHOIX_DES_INTERETS.echeanceEntiere ? x.icne.interetsDeLEcheance : 0;
  const resultatAvantImpot = auCentime(x.resultatDeLaBalance - dotation + x.placement + stock - facture - interets);
  return { dotation, stock, facture, interets, resultatAvantImpot, impot: impotSurLesSocietes(resultatAvantImpot, x.f.impot).impot };
}

/** Le départ du laboratoire : les trois travaux oubliés, le linéaire du plan. */
export const DEPART_DU_LABORATOIRE = { stock: CHOIX_DU_STOCK.oublie, facture: CHOIX_DE_LA_FACTURE.oubliee, interets: CHOIX_DES_INTERETS.oublies, mode: MODES_D_AMORTISSEMENT.lineaire } as const;

// ─────────────────────────────────────────────────────────────────────────────
// LE JOURNAL : LA BALANCE D'OUVERTURE, ET CE QUE LE CHAPITRE Y AJOUTE
// ─────────────────────────────────────────────────────────────────────────────

/** La balance avant inventaire de la fiche, en une écriture, aux comptes du plan du cours. */
export function ouvertureDeLaCloture(c: Pick<Cas, "code">): Ecriture {
  const f = ficheDe(c);
  return {
    date: "31 décembre",
    libelle: "Balance avant inventaire : tout le journal de l'exercice, sans les travaux d'inventaire",
    lignes: f.balanceAvantInventaire.map((l) => ({ compte: VERS_LE_PLAN[l.compte] ?? l.compte, debit: l.debit, credit: l.credit })),
  };
}

/**
 * La balance une fois les travaux de ce chapitre passés, sans l'impôt (le palier suivant le
 * recalcule après ses propres travaux) : le journal d'ouverture de « Dépréciations et provisions ».
 */
export function balanceApresLaCloture(c: Pick<Cas, "code">): Ligne[] {
  const x = clotureDeNova(c);
  return [...ouvertureDeLaCloture(c).lignes, ...x.k.travaux.flatMap((t) => t.lignes.map((l) => ({ compte: VERS_LE_PLAN[l.compte] ?? l.compte, debit: l.debit, credit: l.credit })))];
}

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

/** Ce que le comptable relève au 31 décembre : les documents des travaux d'inventaire. */
function tableauDesReleves(x: ClotureDeNova): TableauDeDonnees {
  const f = x.f;
  return {
    titre: `Ce que le comptable de ${f.entreprise} relève au 31 décembre N`,
    colonnes: ["Relevé"],
    lignes: [
      { libelle: "La ligne de montage", valeurs: [`${eur(f.equipement.ht)} hors taxes, en service le ${dateDe(f.equipement.miseEnService)}, amortie en linéaire sur ${qte(f.equipement.dureeAns)} ans`] },
      { libelle: "Le compte à terme", valeurs: [`${eur(f.placement.montant)} placés le ${dateDe(f.placement.date)} à ${pct(f.placement.tauxAnnuel)} l'an, intérêts versés le ${dateDe(f.placement.echeance)}`] },
      { libelle: "Les composants en magasin", valeurs: [`${qte(x.stock.final.quantite)} jeux comptés le 31 décembre`] },
      {
        libelle: f.factureNonParvenue.fournisseur,
        valeurs: [`${qte(x.fnp.quantite)} jeux à ${eur(x.fnp.prixUnitaire)} hors taxes livrés le ${dateDe(f.factureNonParvenue.livraison)}, facture attendue le ${dateDe(f.factureNonParvenue.arrivee)}`],
      },
      { libelle: "L'emprunt", valeurs: [`${eur(x.icne.capitalDu)} restant dus à ${pct(f.pret.tauxAnnuel)} l'an, prochaine échéance le ${dateDe(x.icne.echeance)}`] },
      { libelle: "L'impôt sur les sociétés", valeurs: [`${pct(f.impot.tauxReduit)} jusqu'à ${eur(f.impot.plafondDuTauxReduit)} de bénéfice, ${pct(f.impot.tauxNormal)} au-delà`] },
    ],
  };
}

/** Les comptes de gestion de la balance avant inventaire. */
function tableauDeLaBalance(x: ClotureDeNova): TableauDeDonnees {
  return {
    titre: `La balance avant inventaire de ${x.f.entreprise} : les comptes de gestion`,
    colonnes: ["Charges", "Produits"],
    lignes: [
      ...x.charges.map((l) => ({ libelle: `${l.compte} · ${l.intitule}`, valeurs: [eur(l.montant), ""] })),
      { libelle: "701 · Ventes de produits finis", valeurs: ["", eur(x.ventes)] },
    ],
  };
}

/** La fiche de stock des composants en décembre. */
function tableauDuStock(x: ClotureDeNova): TableauDeDonnees {
  const f = x.f;
  return {
    titre: "La fiche de stock des jeux de composants, en décembre",
    colonnes: ["Entrée", "Sortie"],
    lignes: f.composantsDeDecembre.mouvements.map((m) => ({
      libelle: `${dateDe(m.date)} · ${m.libelle}`,
      valeurs: m.sens === "entree" ? [`${qte(m.quantite)} jeux à ${eur(m.prixUnitaire!)}`, ""] : ["", `${qte(m.quantite)} jeux`],
    })),
  };
}

/** Du résultat de la balance au résultat net : le passage de la synthèse. */
function tableauDuPassage(x: ClotureDeNova): TableauDeDonnees {
  const nom: Record<string, string> = {
    dotation: "Dotation aux amortissements de la ligne",
    interetsDuPlacement: "Intérêts courus du compte à terme",
    stock: "Stock final de composants",
    factureNonParvenue: "Facture non parvenue",
    interetsCourus: "Intérêts courus de l'emprunt",
  };
  return {
    titre: `De la balance au résultat net de ${x.f.entreprise}`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Résultat de la balance avant inventaire", valeurs: [eur(x.resultatDeLaBalance)] },
      ...x.effets.map((e) => ({ libelle: nom[e.code]!, valeurs: [eur(e.effet)] })),
      { libelle: "Résultat avant impôt", valeurs: [eur(x.resultatAvantImpot)] },
      { libelle: "Impôt sur les sociétés", valeurs: [eur(-x.impot.impot)] },
      { libelle: "Résultat net de ce chapitre", valeurs: [eur(x.resultatNet)] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/** La clôture se joue sur l'exercice de NOVA du monde du cours. */
export const ENTREPRISES_DE_LA_CLOTURE: readonly string[] = ["nova"];

export const LA_CLOTURE: Chapitre = {
  code: "la-cloture",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [
    "BTS CG P2 · Contrôle et production de l'information financière",
    "BTS CG P3 · Gestion des obligations fiscales",
    "DCG UE9 · Comptabilité",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "La clôture",
  accroche:
    "Le premier exercice de NOVA arrive en balance : vous passez les travaux d'inventaire, du stock aux intérêts courus, puis vous calculez le résultat, l'impôt au taux réduit et au taux normal, et ce qui reste à l'entreprise.",
  objectifs: [
    "Lire une balance avant inventaire et en tirer le résultat provisoire",
    "Passer les travaux d'inventaire : la dotation, le stock final, la facture non parvenue, les intérêts courus à payer et à recevoir",
    "Mesurer l'effet de chaque travail, et d'une méthode d'amortissement, sur le résultat et l'impôt",
    "Calculer l'impôt sur les sociétés au taux réduit puis au taux normal, et distinguer taux moyen et taux marginal",
    "Juger une décision de trésorerie au taux marginal de l'impôt",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CLOTURE,
    pourquoi:
      "la clôture se joue sur le premier exercice de NOVA, dans la simulation du cours : une seule entreprise, la même de sa création à son premier bilan, pour que chaque chiffre se retrouve d'un chapitre à l'autre.",
  },
  ouverture: ouvertureDeLaCloture,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le 31 décembre",
      notions: ["income_statement"],
      tableau: (c) => tableauDesReleves(clotureDeNova(c)),
      texte: (c) => {
        const x = clotureDeNova(c);
        const f = x.f;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, la même entreprise de sa création à sa clôture : ${eur(f.apport.montant)} d'apport le ${dateDe(f.apport.date)}, ${eur(f.pret.capital)} empruntés le ${dateDe(f.pret.versement)}, la ligne de montage en service le ${dateDe(f.equipement.miseEnService)}, et ${eur(f.placement.montant)} placés le même jour sur un compte à terme. L'exercice va du 1er janvier au 31 décembre N.`,
          "La balance avant inventaire, tout le journal de l'exercice sans les travaux d'inventaire, est déjà passée : vous la trouvez dans le journal. Avant de lire le résultat, il faut passer ce qui n'apparaît qu'à la fin de l'exercice : l'usure de la ligne, le stock, l'achat livré sans facture, les intérêts nés et pas encore payés ni reçus. Ensuite seulement, l'impôt.",
          `La simulation suppose des mois de ${qte(JOURS_DU_MOIS)} jours, le jour de départ et le jour d'arrivée comptés tous deux, le stock au coût moyen pondéré du mois, l'amortissement linéaire, et une société qui a droit au taux réduit de l'impôt sans avoir versé d'acompte cette première année. Les travaux de prudence et les régularisations viennent au palier suivant.`,
        ];
      },
      repere: () =>
        "Balance avant inventaire, travaux d'inventaire, résultat avant impôt, impôt, résultat net : la clôture se fait toujours dans cet ordre. Un travail d'inventaire rattache à l'exercice une charge ou un produit qui lui appartient, payé ou non.",
    },
    {
      id: "resultat-provisoire",
      objectifs: [0],
      type: "montants",
      titre: "La balance avant inventaire",
      notions: ["income_statement"],
      tableau: (c) => tableauDeLaBalance(clotureDeNova(c)),
      question: (c) => {
        const x = clotureDeNova(c);
        return `La balance porte ${eur(x.ventes)} de ventes. Additionnez ses comptes de charges, du 601 au 665, puis calculez le résultat qu'elle afficherait : les ventes moins les charges.`;
      },
      champs: (c) => {
        const x = clotureDeNova(c);
        return [
          { libelle: "Total des charges de la balance", attendu: x.totalDesCharges, calcul: `${x.charges.map((l) => eur(l.montant)).join(" + ")} = ${eur(x.totalDesCharges)}` },
          { libelle: "Résultat de la balance", attendu: x.resultatDeLaBalance, calcul: `${eur(x.ventes)} − ${eur(x.totalDesCharges)} = ${eur(x.resultatDeLaBalance)}` },
        ];
      },
      explication: () => [
        "Ce résultat est provisoire : il ignore l'usure de la ligne, que personne n'a payée cette année ; il compte en charges tous les composants achetés, même ceux qui restent au magasin ; il oublie un achat livré dont la facture n'est pas arrivée, et des intérêts nés mais ni payés ni reçus. Les travaux d'inventaire vont le corriger.",
      ],
    },
    {
      id: "dotation",
      objectifs: [1],
      type: "ecriture",
      titre: "La dotation de l'exercice",
      notions: ["depreciation"],
      evenement: (c) => {
        const x = clotureDeNova(c);
        const f = x.f;
        return `La ligne de montage (${eur(f.equipement.ht)} hors taxes) est en service depuis le ${dateDe(f.equipement.miseEnService)} ; ${f.entreprise} l'amortit en linéaire sur ${qte(f.equipement.dureeAns)} ans. Du ${dateDe(f.equipement.miseEnService)} au 31 décembre, elle a servi ${qte(x.joursDeService)} jours : la dotation de l'exercice est ${eur(f.equipement.ht)} ÷ ${qte(f.equipement.dureeAns)} × ${qte(x.joursDeService)} ÷ ${qte(JOURS_DE_L_ANNEE)} = ${eur(x.dotation)}. Passez-la.`;
      },
      ecriture: (c) => {
        const x = clotureDeNova(c);
        return {
          date: "31 décembre",
          libelle: "Dotation aux amortissements de la ligne de montage",
          lignes: [
            { role: "la charge de l'exercice, la dotation", compte: "6811", acceptes: ["681"], sens: "debit", montant: x.dotation, indice: "la dotation du plan d'amortissement" },
            { role: "l'amortissement de la ligne", compte: x.f.equipement.compteDAmortissement, acceptes: ["2815", "281"], sens: "credit", montant: x.dotation, indice: "la dotation du plan d'amortissement" },
          ],
        };
      },
      indices: (c) => [
        "Une charge au débit : la dotation aux amortissements (6811).",
        `Au crédit, le compte d'amortissement de la ligne : 28, puis le numéro de l'immobilisation sans le 2 (${clotureDeNova(c).f.equipement.compte}).`,
      ],
      explication: (c) => {
        const x = clotureDeNova(c);
        return [`${eur(x.dotation)} de charges en plus, et pas un euro de sorti : la ligne a été payée à l'achat. Au bilan, elle vaut maintenant ${eur(auCentime(x.f.equipement.ht - x.dotation))} net.`];
      },
      vue: "resultat",
    },
    {
      id: "interets-du-placement",
      objectifs: [1],
      type: "ecriture",
      titre: "Les intérêts du compte à terme",
      notions: ["income_statement"],
      evenement: (c) => {
        const f = clotureDeNova(c).f;
        return `Le compte à terme de ${eur(f.placement.montant)}, ouvert le ${dateDe(f.placement.date)} à ${pct(f.placement.tauxAnnuel)} l'an, versera ses intérêts à son échéance, le ${dateDe(f.placement.echeance)}. Au 31 décembre, rattachez à l'exercice les intérêts qu'il a déjà rapportés.`;
      },
      ecriture: (c) => {
        const x = clotureDeNova(c);
        return {
          date: "31 décembre",
          libelle: "Intérêts courus du compte à terme, à recevoir",
          lignes: [
            { role: "les intérêts à recevoir", compte: x.f.placement.compteDesInteretsCourus, acceptes: [x.f.placement.compte], sens: "debit", montant: x.placement, indice: "les intérêts courus depuis le dépôt" },
            { role: "le produit financier de l'exercice", compte: x.f.placement.compteDeProduit, acceptes: ["768"], sens: "credit", montant: x.placement, indice: "les intérêts courus depuis le dépôt" },
          ],
        };
      },
      indices: (c) => {
        const x = clotureDeNova(c);
        return [
          "Un produit au crédit : les revenus des valeurs mobilières de placement (764).",
          `Au débit, ce que la banque doit déjà à ${x.f.entreprise} : les intérêts courus sur placements (5088). Le montant : le capital × le taux × les jours du dépôt au 31 décembre ÷ ${qte(JOURS_DE_L_ANNEE)}.`,
        ];
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        return [
          `${eur(x.f.placement.montant)} × ${pct(x.f.placement.tauxAnnuel)} × ${qte(x.joursDuPlacement)} ÷ ${qte(JOURS_DE_L_ANNEE)} = ${eur(x.placement)} de produits financiers, et pas un euro encaissé : la banque les versera le ${dateDe(x.f.placement.echeance)}, avec le capital. Un produit appartient à l'exercice où il est acquis, comme une charge à celui où elle naît.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "predire-le-stock",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le stock",
      notions: ["stock"],
      question: (c) => {
        const x = clotureDeNova(c);
        return `Avant de compter, pariez. ${qte(x.stock.final.quantite)} jeux de composants restent au magasin le 31 décembre ; leur achat est déjà en charges. Les constater en stock va faire…`;
      },
      options: () => {
        const voir = "Le laboratoire de l'étape suivante passe chaque travail, et montre de quel côté il pousse le résultat.";
        return [
          { texte: "Monter le résultat : ces jeux sortent des charges de l'exercice", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Baisser le résultat : un stock est une dépense de plus", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Ne rien changer au résultat : un stock ne touche que le bilan", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-travaux",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire des travaux oubliés",
      notions: ["stock", "depreciation", "income_statement"],
      question: (c) => {
        const x = clotureDeNova(c);
        return `Le comptable a passé la dotation et les intérêts du compte à terme, mais il en a oublié : le stock final, la facture de ${x.f.factureNonParvenue.fournisseur} et les intérêts courus de l'emprunt. Passez-les au laboratoire, et choisissez pour chacun sa manière ; changez aussi le mode d'amortissement. Le tableau suit l'effet de chaque travail, le résultat, l'impôt et la trésorerie.`;
      },
      leviers: (c) => {
        const x = clotureDeNova(c);
        return [
          {
            code: "stock",
            libelle: "Le stock final",
            unite: "",
            min: CHOIX_DU_STOCK.oublie,
            max: CHOIX_DU_STOCK.dernierPrix,
            pas: 1,
            depart: DEPART_DU_LABORATOIRE.stock,
            choix: [
              { valeur: CHOIX_DU_STOCK.oublie, libelle: "Oublié" },
              { valeur: CHOIX_DU_STOCK.coutMoyen, libelle: `Au coût moyen, ${eur(x.stock.coutMoyen)}` },
              { valeur: CHOIX_DU_STOCK.dernierPrix, libelle: `Au dernier prix, ${eur(x.peps.coutUnitaire)}` },
            ],
          },
          {
            code: "facture",
            libelle: "La facture non parvenue",
            unite: "",
            min: CHOIX_DE_LA_FACTURE.oubliee,
            max: CHOIX_DE_LA_FACTURE.tvaComprise,
            pas: 1,
            depart: DEPART_DU_LABORATOIRE.facture,
            choix: [
              { valeur: CHOIX_DE_LA_FACTURE.oubliee, libelle: "Oubliée" },
              { valeur: CHOIX_DE_LA_FACTURE.horsTaxes, libelle: "Hors taxes, la TVA à part" },
              { valeur: CHOIX_DE_LA_FACTURE.tvaComprise, libelle: "TVA comprise en charges" },
            ],
          },
          {
            code: "interets",
            libelle: "Les intérêts courus de l'emprunt",
            unite: "",
            min: CHOIX_DES_INTERETS.oublies,
            max: CHOIX_DES_INTERETS.echeanceEntiere,
            pas: 1,
            depart: DEPART_DU_LABORATOIRE.interets,
            choix: [
              { valeur: CHOIX_DES_INTERETS.oublies, libelle: "Oubliés" },
              { valeur: CHOIX_DES_INTERETS.auProrata, libelle: `Au prorata, ${qte(x.icne.jours)} jours` },
              { valeur: CHOIX_DES_INTERETS.echeanceEntiere, libelle: "L'échéance entière" },
            ],
          },
          {
            code: "mode",
            libelle: "L'amortissement de la ligne",
            unite: "",
            min: MODES_D_AMORTISSEMENT.lineaire,
            max: MODES_D_AMORTISSEMENT.degressif,
            pas: 1,
            depart: DEPART_DU_LABORATOIRE.mode,
            choix: [
              { valeur: MODES_D_AMORTISSEMENT.lineaire, libelle: "Linéaire" },
              { valeur: MODES_D_AMORTISSEMENT.degressif, libelle: "Dégressif" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = clotureDeNova(c);
        const l = laboratoireDesTravaux(x, p);
        const d = laboratoireDesTravaux(x, DEPART_DU_LABORATOIRE);
        return [
          { libelle: "Résultat de la balance", montant: x.resultatDeLaBalance, reference: x.resultatDeLaBalance },
          { libelle: "Dotation aux amortissements", montant: -l.dotation, reference: -d.dotation, effet: true },
          { libelle: "Intérêts courus du compte à terme", montant: x.placement, reference: x.placement, effet: true },
          { libelle: "Stock final de composants", montant: l.stock, reference: d.stock, effet: true },
          { libelle: "Facture non parvenue", montant: -l.facture, reference: -d.facture, effet: true },
          { libelle: "Intérêts courus de l'emprunt", montant: -l.interets, reference: -d.interets, effet: true },
          { libelle: "Résultat avant impôt", montant: l.resultatAvantImpot, reference: d.resultatAvantImpot, fort: true },
          { libelle: "Impôt sur les sociétés", montant: l.impot, reference: d.impot },
          { libelle: "Banque et compte à terme", montant: x.tresorerie, reference: x.tresorerie },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      defi: (c) => {
        const x = clotureDeNova(c);
        const solution = { stock: CHOIX_DU_STOCK.coutMoyen, facture: CHOIX_DE_LA_FACTURE.horsTaxes, interets: CHOIX_DES_INTERETS.auProrata, mode: MODES_D_AMORTISSEMENT.lineaire };
        return {
          consigne: `Passez ce qui manque, chacun au bon montant, avec les méthodes de ${x.f.entreprise} (le coût moyen et le linéaire), et retrouvez le résultat avant impôt de la clôture.`,
          atteint: (p) => laboratoireDesTravaux(x, p).resultatAvantImpot === x.resultatAvantImpot,
          indice: (p) => {
            if (p.stock !== CHOIX_DU_STOCK.coutMoyen)
              return p.stock === CHOIX_DU_STOCK.oublie
                ? `Le stock final manque : ${qte(x.stock.final.quantite)} jeux achetés cette année n'ont pas servi, et leur achat pèse encore sur le résultat.`
                : `Au dernier prix, ${qte(x.stock.final.quantite)} jeux valent ${eur(x.peps.stock)} ; ${x.f.entreprise} valorise son stock au coût moyen, et une méthode ne se change pas d'un exercice à l'autre.`;
            if (p.facture !== CHOIX_DE_LA_FACTURE.horsTaxes)
              return p.facture === CHOIX_DE_LA_FACTURE.oubliee
                ? `La facture de ${x.f.factureNonParvenue.fournisseur} manque : les jeux livrés le ${dateDe(x.f.factureNonParvenue.livraison)} sont au magasin, leur achat n'est nulle part.`
                : `La TVA de la facture, ${eur(x.fnp.tva)}, n'est pas une charge : ${x.f.entreprise} la récupérera. Seul le hors taxes va en charges.`;
            if (p.interets !== CHOIX_DES_INTERETS.auProrata)
              return p.interets === CHOIX_DES_INTERETS.oublies
                ? `Les intérêts courus manquent : ${qte(x.icne.jours)} des ${qte(x.icne.joursDeLaPeriode)} jours que paiera l'échéance du ${dateDe(x.icne.echeance)} sont dans l'exercice.`
                : `L'échéance du ${dateDe(x.icne.echeance)} paie ${qte(x.icne.joursDeLaPeriode)} jours, dont ${qte(x.icne.joursDeLaPeriode - x.icne.jours)} en N+1 : seule la part de l'exercice se rattache.`;
            return `En dégressif, la dotation passe à ${eur(x.degressif.dotation)} : le plan de ${x.f.entreprise} est linéaire.`;
          },
          solution,
        };
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        const d = laboratoireDesTravaux(x, DEPART_DU_LABORATOIRE);
        return [
          `Le stock final monte le résultat de ${eur(x.stockFinal)}, la facture non parvenue le baisse de ${eur(x.fnp.ht)}, les intérêts courus de ${eur(x.icne.montant)} : le résultat de ${eur(d.resultatAvantImpot)} était trop beau de ${eur(auCentime(d.resultatAvantImpot - x.resultatAvantImpot))}, et l'impôt avec lui (${eur(d.impot)} au lieu de ${eur(x.impot.impot)}).`,
          `Aucun de ces travaux ne fait bouger la banque et le compte à terme : ${eur(x.tresorerie)} dans toutes les positions. En dégressif, la dotation passerait à ${eur(x.degressif.dotation)} et l'impôt baisserait, sans un euro de plus en banque cette année : une méthode d'amortissement change le résultat, pas l'argent.`,
        ];
      },
    },
    {
      id: "le-stock-final",
      objectifs: [1],
      type: "montants",
      titre: "Le stock final, au coût moyen",
      notions: ["stock"],
      tableau: (c) => tableauDuStock(clotureDeNova(c)),
      question: (c) => {
        const x = clotureDeNova(c);
        return `${x.f.entreprise} valorise son stock au coût moyen pondéré du mois : la valeur des entrées de décembre divisée par les jeux entrés (le stock du 1er décembre est nul). Calculez ce coût moyen, les jeux qui restent après les sorties, puis la valeur du stock final.`;
      },
      champs: (c) => {
        const x = clotureDeNova(c);
        const entrees = x.f.composantsDeDecembre.mouvements.filter((m) => m.sens === "entree");
        const sorties = x.f.composantsDeDecembre.mouvements.filter((m) => m.sens === "sortie");
        return [
          {
            libelle: "Coût moyen pondéré d'un jeu",
            attendu: x.stock.coutMoyen,
            calcul: `(${entrees.map((m) => `${qte(m.quantite)} × ${eur(m.prixUnitaire!)}`).join(" + ")}) ÷ ${qte(x.stock.entrees.quantite)} = ${eur(x.stock.entrees.valeur)} ÷ ${qte(x.stock.entrees.quantite)} = ${eur(x.stock.coutMoyen)}`,
          },
          { libelle: "Jeux en stock au 31 décembre", attendu: x.stock.final.quantite, calcul: `${qte(x.stock.entrees.quantite)} − ${sorties.map((m) => qte(m.quantite)).join(" − ")} = ${qte(x.stock.final.quantite)}` },
          { libelle: "Stock final", attendu: x.stockFinal, calcul: `${qte(x.stock.final.quantite)} × ${eur(x.stock.coutMoyen)} = ${eur(x.stockFinal)}` },
        ];
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        return [
          `Les jeux consommés valent ${eur(x.stock.sorties.valeur)}, ceux qui restent ${eur(x.stockFinal)} : ensemble, ils refont les ${eur(x.stock.entrees.valeur)} achetés en décembre. C'est ce que le laboratoire comptait au coût moyen ; au dernier prix, ${eur(x.peps.coutUnitaire)}, le stock vaudrait ${eur(x.peps.stock)}.`,
        ];
      },
    },
    {
      id: "ecriture-du-stock",
      objectifs: [1],
      type: "ecriture",
      titre: "Le stock, au journal",
      notions: ["stock"],
      evenement: (c) => `L'inventaire du 31 décembre compte ${eur(clotureDeNova(c).stockFinal)} de composants. Constatez le stock final.`,
      ecriture: (c) => {
        const x = clotureDeNova(c);
        return {
          date: "31 décembre",
          libelle: "Constatation du stock final de composants",
          lignes: [
            { role: "le stock qui entre au bilan", compte: "31", sens: "debit", montant: x.stockFinal, indice: "la valeur de l'inventaire" },
            { role: "la variation du stock", compte: "6031", acceptes: ["603"], sens: "credit", montant: x.stockFinal, indice: "la valeur de l'inventaire" },
          ],
        };
      },
      indices: () => [
        "Au débit, le stock de matières premières (31) : il entre au bilan.",
        "Au crédit, la variation des stocks de matières premières (6031) : un compte de charges qui, crédité, vient en moins des achats de l'exercice.",
      ],
      explication: (c) => {
        const x = clotureDeNova(c);
        return [`Les achats de composants restent entiers au 601 ; la variation, au crédit, en retire les ${eur(x.stockFinal)} qui n'ont pas servi. L'exercice ne porte que ce qu'il a consommé, et le résultat monte d'autant, comme vous l'aviez parié ou vu.`];
      },
      vue: "resultat",
    },
    {
      id: "la-facture-non-parvenue",
      objectifs: [1],
      type: "ecriture",
      titre: "La facture non parvenue",
      notions: ["stock", "vat_payable"],
      evenement: (c) => {
        const x = clotureDeNova(c);
        return `Le ${dateDe(x.f.factureNonParvenue.livraison)}, ${x.f.factureNonParvenue.fournisseur} a livré ${qte(x.fnp.quantite)} jeux à ${eur(x.fnp.prixUnitaire)} hors taxes, avec une TVA à ${pct(x.f.tauxDeTva)} ; sa facture n'arrivera que le ${dateDe(x.f.factureNonParvenue.arrivee)}. Les jeux sont dans le stock que vous venez de compter : rattachez leur achat à l'exercice.`;
      },
      ecriture: (c) => {
        const x = clotureDeNova(c);
        return {
          date: "31 décembre",
          libelle: `Facture non parvenue, ${x.f.factureNonParvenue.fournisseur}`,
          lignes: [
            { role: "l'achat de l'exercice", compte: "601", sens: "debit", montant: x.fnp.ht, indice: "le montant hors taxes de la livraison" },
            { role: "la TVA de la facture attendue", compte: "44586", sens: "debit", montant: x.fnp.tva, indice: "la TVA de la livraison" },
            { role: "la dette envers le fournisseur", compte: "408", sens: "credit", montant: x.fnp.ttc, indice: "le montant toutes taxes comprises" },
          ],
        };
      },
      indices: () => [
        "Au débit, l'achat hors taxes (601), et sa TVA sur un compte d'attente : TVA sur factures non parvenues (44586).",
        "Au crédit, la dette envers le fournisseur, sur un compte à part, toutes taxes comprises : fournisseurs, factures non parvenues (408).",
      ],
      explication: (c) => {
        const x = clotureDeNova(c);
        return [
          `Sans cette écriture, le stock et les consommations compteraient des jeux dont l'achat n'est passé nulle part : le résultat serait trop beau de ${eur(x.fnp.ht)}. La TVA, ${eur(x.fnp.tva)}, n'est pas une charge : elle se récupérera. Au 1er janvier N+1, l'écriture s'extournera, et la facture se passera à son arrivée.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "les-interets-courus",
      objectifs: [1],
      type: "montants",
      titre: "Les intérêts courus de l'emprunt",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = clotureDeNova(c);
        return `La prochaine échéance de l'emprunt tombe le ${dateDe(x.icne.echeance)} : elle paiera les intérêts du trimestre commencé le ${dateDe(x.icne.depuis)}. Calculez ces intérêts, les jours qui en tombent dans l'exercice, puis les intérêts courus au 31 décembre.`;
      },
      champs: (c) => {
        const x = clotureDeNova(c);
        const f = x.f;
        return [
          {
            libelle: "Intérêts de la prochaine échéance",
            attendu: x.icne.interetsDeLEcheance,
            calcul: `${eur(x.icne.capitalDu)} restant dus × ${pct(f.pret.tauxAnnuel)} ÷ ${qte(f.pret.echeancesParAn)} = ${eur(x.icne.interetsDeLEcheance)}`,
          },
          {
            libelle: "Jours courus dans l'exercice",
            attendu: x.icne.jours,
            calcul: `du ${dateDe(x.icne.depuis)} au 31 décembre, jours compris, en mois de ${qte(JOURS_DU_MOIS)} jours : ${qte(x.icne.jours)} jours sur ${qte(x.icne.joursDeLaPeriode)}`,
          },
          {
            libelle: "Intérêts courus au 31 décembre",
            attendu: x.icne.montant,
            calcul: `${eur(x.icne.interetsDeLEcheance)} × ${qte(x.icne.jours)} ÷ ${qte(x.icne.joursDeLaPeriode)} = ${eur(x.icne.montant)}`,
          },
        ];
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        return [
          `${eur(x.icne.montant)} d'intérêts sont nés cette année et ne seront payés que l'an prochain : ils appartiennent à l'exercice. Les ${qte(x.icne.joursDeLaPeriode - x.icne.jours)} derniers jours de la période, eux, appartiennent à N+1.`,
        ];
      },
    },
    {
      id: "ecriture-des-interets-courus",
      objectifs: [1],
      type: "ecriture",
      titre: "Les intérêts courus, au journal",
      notions: ["loan_schedule"],
      evenement: (c) => `Passez les intérêts courus de l'emprunt au 31 décembre : ${eur(clotureDeNova(c).icne.montant)}.`,
      ecriture: (c) => {
        const x = clotureDeNova(c);
        return {
          date: "31 décembre",
          libelle: "Intérêts courus sur l'emprunt",
          lignes: [
            { role: "la charge d'intérêts de l'exercice", compte: "6611", acceptes: ["661"], sens: "debit", montant: x.icne.montant, indice: "les intérêts courus calculés" },
            { role: "la dette d'intérêts courus", compte: "1688", sens: "credit", montant: x.icne.montant, indice: "les intérêts courus calculés" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : les intérêts des emprunts (6611).",
        "Au crédit, une dette qui suit l'emprunt : les intérêts courus sur emprunts (1688).",
      ],
      explication: (c) => {
        const x = clotureDeNova(c);
        return [
          `Les intérêts de l'exercice font maintenant ${eur(x.interetsPayes)} payés plus ${eur(x.icne.montant)} courus, soit ${eur(x.chargeDeLEmprunt)} : le chapitre « L'emprunt » et la clôture disent le même chiffre. Au 1er janvier N+1, l'écriture s'extourne ; l'échéance du ${dateDe(x.icne.echeance)} se passe alors en entier.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "resultat-avant-impot",
      objectifs: [2],
      type: "montants",
      titre: "Le résultat avant impôt",
      notions: ["income_statement"],
      question: () =>
        "Les travaux d'inventaire de ce chapitre sont passés. De combien ont-ils changé le résultat de la balance, et quel est le résultat avant impôt ?",
      champs: (c) => {
        const x = clotureDeNova(c);
        return [
          { libelle: "Effet net des travaux d'inventaire", attendu: x.effetNet, calcul: `${somme(x.effets.map((e) => e.effet))} = ${eur(x.effetNet)}` },
          { libelle: "Résultat avant impôt", attendu: x.resultatAvantImpot, calcul: `${eur(x.resultatDeLaBalance)} ${terme(x.effetNet)} = ${eur(x.resultatAvantImpot)}` },
        ];
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        return [
          `${x.f.entreprise} gagne ${eur(x.resultatAvantImpot)} avant impôt. Les travaux ont retiré ${eur(-x.effetNet)} au résultat de la balance sans faire bouger la banque : ils rattachent à l'exercice ce qui lui appartient, ni plus ni moins.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "predire-l-impot",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur l'impôt",
      notions: ["income_statement"],
      question: (c) => {
        const x = clotureDeNova(c);
        const b = x.f.impot;
        return `Pariez avant de calculer. ${x.f.entreprise} gagne ${eur(x.resultatAvantImpot)} ; l'impôt est à ${pct(b.tauxReduit)} jusqu'à ${eur(b.plafondDuTauxReduit)}, à ${pct(b.tauxNormal)} au-delà. Si une charge de ${eur(CHARGE_DU_PARI)} de plus venait réduire ce résultat, l'impôt baisserait de…`;
      },
      options: (c) => {
        const x = clotureDeNova(c);
        const b = x.f.impot;
        const voir = "Faites glisser le résultat à l'étape suivante : la pente de l'impôt donne la réponse.";
        return [
          { texte: `${eur(CHARGE_DU_PARI * b.tauxNormal)} : le dernier euro est au taux normal`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${eur(CHARGE_DU_PARI * b.tauxReduit)} : ${x.f.entreprise} a droit au taux réduit`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `${eur(Math.round(CHARGE_DU_PARI * x.tauxMoyen))} environ : le taux moyen de son impôt`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-taux-moyen",
      objectifs: [3],
      type: "curseur",
      titre: "Taux moyen, taux marginal",
      notions: ["income_statement"],
      question: (c) => {
        const x = clotureDeNova(c);
        const b = x.f.impot;
        return `Faites varier le résultat fiscal de ${eur(b.plafondDuTauxReduit)} à ${eur(RESULTAT_MAXIMAL_DU_CURSEUR)}. Une droite donne l'impôt au barème de ${x.f.entreprise}, l'autre ${pct(TAUX_MOYEN_CHERCHE)} du résultat. Placez le curseur sur le plus petit résultat où l'impôt atteint ${pct(TAUX_MOYEN_CHERCHE)} du résultat, puis validez.`;
      },
      grandeur: () => ({ libelle: "Résultat fiscal", unite: "€" }),
      cible: (c) => {
        const x = clotureDeNova(c);
        return { attendu: x.resultatAuTauxMoyen, min: x.f.impot.plafondDuTauxReduit, max: RESULTAT_MAXIMAL_DU_CURSEUR };
      },
      zones: ["Taux moyen au-dessus du repère", "Taux moyen sous le repère"],
      rates: () => ({
        dessous: "À ce résultat, l'impôt reste sous le repère : le taux réduit pèse encore lourd dans la moyenne.",
        dessus: "Plus bas, l'impôt atteint encore le repère : cherchez le plus petit résultat.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, r) => {
        const x = clotureDeNova(c);
        const b = x.f.impot;
        const reduit = auCentime(b.plafondDuTauxReduit * b.tauxReduit);
        const normal = auCentime((r - b.plafondDuTauxReduit) * b.tauxNormal);
        return [
          { libelle: "Impôt au taux réduit", montant: reduit },
          { libelle: "Impôt au taux normal", montant: normal },
          { libelle: "Impôt au barème", montant: auCentime(reduit + normal), fort: true },
          { libelle: `${pct(TAUX_MOYEN_CHERCHE)} du résultat`, montant: auCentime(r * TAUX_MOYEN_CHERCHE) },
        ];
      },
      droites: (c) => {
        const b = clotureDeNova(c).f.impot;
        return {
          produit: (r) => b.plafondDuTauxReduit * b.tauxReduit + (r - b.plafondDuTauxReduit) * b.tauxNormal,
          cout: (r) => r * TAUX_MOYEN_CHERCHE,
          libelles: ["Impôt au barème", `${pct(TAUX_MOYEN_CHERCHE)} du résultat`],
        };
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        const b = x.f.impot;
        return [
          `Les deux droites se croisent à ${eur(x.resultatAuTauxMoyen)} : au-delà, ${x.f.entreprise} paie en moyenne plus de ${pct(TAUX_MOYEN_CHERCHE)}. À ${eur(x.resultatAvantImpot)}, son taux moyen est de ${pct(Math.round(x.tauxMoyen * 10_000) / 10_000)} ; il monte vers ${pct(b.tauxNormal)} sans jamais l'atteindre, car le taux réduit lui laisse ${eur(auCentime(b.plafondDuTauxReduit * (b.tauxNormal - b.tauxReduit)))} d'avantage quel que soit le bénéfice.`,
          `Mais la droite de l'impôt a une pente de ${pct(b.tauxNormal)} : chaque euro de résultat en plus ou en moins pèse ${pct(b.tauxNormal)} d'impôt. C'est le taux marginal qui chiffre une décision : une charge de ${eur(CHARGE_DU_PARI)} en fait économiser ${eur(CHARGE_DU_PARI * b.tauxNormal)}.`,
        ];
      },
    },
    {
      id: "l-impot",
      objectifs: [3],
      type: "montants",
      titre: "L'impôt sur les sociétés",
      notions: ["income_statement"],
      question: (c) => {
        const b = clotureDeNova(c).f.impot;
        return `Le résultat fiscal est ici le résultat avant impôt. Calculez l'impôt au taux réduit (${pct(b.tauxReduit)} sur les premiers ${eur(b.plafondDuTauxReduit)}), l'impôt au taux normal (${pct(b.tauxNormal)} sur le reste), l'impôt de l'exercice arrondi à l'euro, puis le résultat net.`;
      },
      champs: (c) => {
        const x = clotureDeNova(c);
        const i = x.impot;
        const b = x.f.impot;
        return [
          { libelle: "Impôt au taux réduit", attendu: i.aTauxReduit, calcul: `${eur(i.baseAuTauxReduit)} × ${pct(b.tauxReduit)} = ${eur(i.aTauxReduit)}` },
          {
            libelle: "Impôt au taux normal",
            attendu: i.aTauxNormal,
            calcul: `(${eur(x.resultatAvantImpot)} − ${eur(b.plafondDuTauxReduit)}) × ${pct(b.tauxNormal)} = ${eur(i.baseAuTauxNormal)} × ${pct(b.tauxNormal)} = ${eur(i.aTauxNormal)}`,
          },
          { libelle: "Impôt sur les sociétés de l'exercice", attendu: i.impot, calcul: `${eur(i.aTauxReduit)} + ${eur(i.aTauxNormal)} = ${eur(i.exact)}, arrondi à ${eur(i.impot)}` },
          { libelle: "Résultat net", attendu: x.resultatNet, calcul: `${eur(x.resultatAvantImpot)} − ${eur(i.impot)} = ${eur(x.resultatNet)}` },
        ];
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        return [
          `L'impôt prend ${pct(Math.round(x.tauxMoyen * 10_000) / 10_000)} du résultat, son taux moyen ; le dernier euro paie ${pct(x.f.impot.tauxNormal)}, son taux marginal. Une société nouvelle ne verse pas d'acompte la première année : tout l'impôt de N reste dû à l'État au 31 décembre.`,
        ];
      },
    },
    {
      id: "ecriture-de-l-impot",
      objectifs: [3],
      type: "ecriture",
      titre: "L'impôt, au journal",
      notions: ["income_statement"],
      evenement: (c) => `Passez l'impôt sur les sociétés de l'exercice : ${eur(clotureDeNova(c).impot.impot)}, à payer à l'État.`,
      ecriture: (c) => {
        const x = clotureDeNova(c);
        return {
          date: "31 décembre",
          libelle: "Impôt sur les sociétés de l'exercice",
          lignes: [
            { role: "la charge d'impôt", compte: "695", sens: "debit", montant: x.impot.impot, indice: "l'impôt calculé" },
            { role: "la dette envers l'État", compte: "444", sens: "credit", montant: x.impot.impot, indice: "l'impôt calculé" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : les impôts sur les bénéfices (695).",
        "Au crédit, une dette envers l'État : aucun acompte n'a été versé cette première année, tout reste dû (444).",
      ],
      explication: (c) => [`Le compte de résultat de ce chapitre est complet : le résultat net est de ${eur(clotureDeNova(c).resultatNet)}.`],
      vue: "resultat",
    },
    {
      id: "predire-le-placement",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur le placement",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = clotureDeNova(c);
        const f = x.f;
        return `${f.entreprise} a emprunté ${eur(f.pret.capital)} à ${pct(f.pret.tauxAnnuel)} le ${dateDe(f.pret.versement)}, et placé ${eur(f.placement.montant)} à ${pct(f.placement.tauxAnnuel)} le ${dateDe(f.placement.date)}. Sans l'emprunt, elle aurait placé ${eur(f.pret.capital)} de moins. Pariez : sur l'exercice, garder l'emprunt…`;
      },
      options: (c) => {
        const x = clotureDeNova(c);
        const voir = "Le curseur de l'étape suivante cherche le taux de placement qui paierait l'emprunt.";
        return [
          { texte: "Coûte : la même somme placée rapporte moins que l'emprunt ne coûte", juste: true, retour: `Bon pari. ${voir}` },
          {
            texte: `Rapporte : le compte à terme (${eur(x.placement)}) rapporte plus que l'emprunt ne coûte`,
            juste: false,
            retour: `Pari à vérifier : le compte à terme porte ${eur(x.f.placement.montant)}, pas ${eur(x.f.pret.capital)}. ${voir}`,
          },
          { texte: "Ne coûte rien : intérêts payés et intérêts reçus se compensent", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-taux-qui-paierait-l-emprunt",
      objectifs: [4],
      type: "curseur",
      titre: "Le taux qui paierait l'emprunt",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = clotureDeNova(c);
        const f = x.f;
        return `Faites varier le taux du compte à terme, en points de base (100 points de base font 1 %). Une droite donne ce que ${eur(f.pret.capital)} placés du ${dateDe(f.placement.date)} au 31 décembre rapporteraient, l'autre ce que l'emprunt coûte sur l'exercice, intérêts courus compris. Placez le curseur sur le plus petit taux où le placement paie l'emprunt, puis validez.`;
      },
      grandeur: () => ({ libelle: "Taux du compte à terme", unite: "points de base" }),
      cible: (c) => ({ attendu: clotureDeNova(c).tauxQuiPaieLEmprunt, min: 0, max: TAUX_MAXIMAL_DU_CURSEUR }),
      zones: ["Le placement paie l'emprunt", "L'emprunt coûte"],
      rates: () => ({
        dessous: "À ce taux, les fonds placés rapportent moins que l'emprunt ne coûte.",
        dessus: "Plus bas, le placement paie encore l'emprunt : cherchez le plus petit taux.",
      }),
      montrer: "Montrer le taux",
      lecture: (c, t) => {
        const x = clotureDeNova(c);
        const produit = auCentime((x.f.pret.capital * t * x.joursDuPlacement) / POINTS_DE_BASE / JOURS_DE_L_ANNEE);
        return [
          { libelle: "Intérêts des fonds placés", montant: produit },
          { libelle: "Charge de l'emprunt sur l'exercice", montant: x.chargeDeLEmprunt },
          { libelle: "Coût net de l'emprunt gardé", montant: auCentime(x.chargeDeLEmprunt - produit), fort: true },
        ];
      },
      droites: (c) => {
        const x = clotureDeNova(c);
        return {
          produit: (t) => (x.f.pret.capital * t * x.joursDuPlacement) / POINTS_DE_BASE / JOURS_DE_L_ANNEE,
          cout: () => x.chargeDeLEmprunt,
          libelles: ["Intérêts des fonds placés", "Charge de l'emprunt sur l'exercice"],
        };
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        const f = x.f;
        return [
          `Il faudrait placer à ${pct(x.tauxQuiPaieLEmprunt / POINTS_DE_BASE)} pour que l'emprunt gardé ne coûte rien. Le seuil est sous les ${pct(f.pret.tauxAnnuel)} de l'emprunt parce que son capital baisse à chaque échéance, alors que la comparaison garde les ${eur(f.pret.capital)} placés jusqu'au 31 décembre : une hypothèse qui flatte le placement.`,
          `À ${pct(f.placement.tauxAnnuel)}, le taux du compte à terme, le placement ne paie pas l'emprunt : l'étape suivante chiffre ce qu'il en coûte, avant et après impôt.`,
        ];
      },
    },
    {
      id: "emprunter-pour-placer",
      objectifs: [4],
      type: "montants",
      titre: "Emprunter pour placer ?",
      notions: ["loan_schedule", "income_statement"],
      question: (c) => {
        const f = clotureDeNova(c).f;
        return `Le dirigeant défend son choix : « Le compte à terme nous rapporte. » Chiffrez ce que garder l'emprunt a coûté sur l'exercice : sa charge, ce que les mêmes ${eur(f.pret.capital)} auraient rapporté placés au taux du compte à terme, le coût net avant impôt, puis après impôt, au taux marginal de ${f.entreprise}.`;
      },
      champs: (c) => {
        const x = clotureDeNova(c);
        const f = x.f;
        return [
          { libelle: "Charge de l'emprunt sur l'exercice", attendu: x.chargeDeLEmprunt, calcul: `${eur(x.interetsPayes)} payés + ${eur(x.icne.montant)} courus = ${eur(x.chargeDeLEmprunt)}` },
          {
            libelle: "Intérêts des mêmes fonds placés",
            attendu: x.produitDesFondsPlaces,
            calcul: `${eur(f.pret.capital)} × ${pct(f.placement.tauxAnnuel)} × ${qte(x.joursDuPlacement)} ÷ ${qte(JOURS_DE_L_ANNEE)} = ${eur(x.produitDesFondsPlaces)}`,
          },
          { libelle: "Coût net avant impôt", attendu: x.coutNetAvantImpot, calcul: `${eur(x.chargeDeLEmprunt)} − ${eur(x.produitDesFondsPlaces)} = ${eur(x.coutNetAvantImpot)}` },
          {
            libelle: "Coût net après impôt",
            attendu: x.coutNetApresImpot,
            calcul: `${eur(x.coutNetAvantImpot)} × (1 − ${pct(f.impot.tauxNormal)}) = ${eur(x.coutNetApresImpot)}, au taux marginal`,
          },
        ];
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        return [
          `Le compte à terme rapporte, mais moins que l'emprunt ne coûte : garder les fonds empruntés coûte ${eur(x.coutNetAvantImpot)} sur l'exercice, ${eur(x.coutNetApresImpot)} après impôt, puisque cette charge nette a fait baisser l'impôt de ${pct(x.f.impot.tauxNormal)} de son montant. Comparer les intérêts du compte à terme à ceux de l'emprunt, c'est comparer deux sommes différentes.`,
          "Le placement n'est pas une erreur pour autant : il garde une réserve pour la gamme de N+1. Ce coût est le prix de cette réserve, et c'est à ce prix qu'on la juge.",
        ];
      },
    },
    {
      id: "variante-degressive",
      objectifs: [2],
      type: "montants",
      titre: "Variante : la ligne en dégressif",
      notions: ["depreciation", "income_statement"],
      question: (c) => {
        const x = clotureDeNova(c);
        const f = x.f;
        return `Variante : ${f.entreprise} amortit la ligne en dégressif (coefficient de ${qte(x.degressif.coefficient)} pour ${qte(f.equipement.dureeAns)} ans), et tout le reste est inchangé. Calculez la dotation de l'exercice, le résultat avant impôt, l'impôt, puis l'impôt en moins par rapport au linéaire.`;
      },
      champs: (c) => {
        const x = clotureDeNova(c);
        const f = x.f;
        const d = x.degressif;
        return [
          {
            libelle: "Dotation dégressive de l'exercice",
            attendu: d.dotation,
            calcul: `${eur(f.equipement.ht)} × ${qte(d.coefficient)} ÷ ${qte(f.equipement.dureeAns)} × ${qte(d.mois)} ÷ 12 = ${eur(d.dotation)} : le dégressif part du 1er jour du mois d'acquisition, ${MOIS_DE_L_EXERCICE[f.equipement.miseEnService.mois - 1]}`,
          },
          { libelle: "Résultat avant impôt en dégressif", attendu: d.resultatAvantImpot, calcul: `${eur(x.resultatAvantImpot)} + ${eur(x.dotation)} − ${eur(d.dotation)} = ${eur(d.resultatAvantImpot)}` },
          {
            libelle: "Impôt en dégressif",
            attendu: d.impot,
            calcul: `${eur(auCentime(f.impot.plafondDuTauxReduit * f.impot.tauxReduit))} + (${eur(d.resultatAvantImpot)} − ${eur(f.impot.plafondDuTauxReduit)}) × ${pct(f.impot.tauxNormal)}, arrondi : ${eur(d.impot)}`,
          },
          { libelle: "Impôt en moins cette année", attendu: d.impotEnMoins, calcul: `${eur(x.impot.impot)} − ${eur(d.impot)} = ${eur(d.impotEnMoins)}` },
        ];
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        const d = x.degressif;
        return [
          `${eur(d.dotationEnPlus)} de dotation en plus font ${eur(d.impotEnMoins)} d'impôt en moins cette année : le taux marginal, à l'arrondi de l'euro près. La banque, elle, ne voit rien cette année : l'impôt de N n'est pas encore payé, et une dotation ne sort jamais d'argent.`,
        ];
      },
    },
    {
      id: "le-degressif-differe",
      objectifs: [2],
      type: "choix",
      titre: "Ce que le dégressif fait gagner",
      notions: ["depreciation"],
      question: (c) => {
        const d = clotureDeNova(c).degressif;
        return `Le dirigeant veut passer la ligne en dégressif : « ${eur(d.impotEnMoins)} d'impôt en moins, c'est toujours ça de gagné. » Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = clotureDeNova(c);
        const d = x.degressif;
        return [
          {
            texte: `L'impôt n'est que décalé : la ligne s'amortit de ${eur(x.f.equipement.ht)} en tout, dans les deux modes`,
            juste: true,
            retour: `Oui. Ce que le dégressif retire au résultat de N, il le rend aux exercices suivants, dont les dotations seront plus faibles ; l'impôt suit. ${x.f.entreprise} garde ${eur(d.impotEnMoins)} un peu plus longtemps, elle ne les gagne pas. Et le mode d'amortissement se choisit pour décrire l'usure de la ligne ; en changer demande une raison, la permanence des méthodes l'exige.`,
          },
          {
            texte: `C'est un gain de ${eur(d.impotEnMoins)} pour ${x.f.entreprise}, acquis pour de bon`,
            juste: false,
            retour: `Non : sur la durée du plan, les dotations font ${eur(x.f.equipement.ht)} dans les deux modes. Plus de dotation en N, c'est moins de dotation ensuite, et plus d'impôt alors.`,
          },
          {
            texte: `C'est un gain de ${eur(d.dotationEnPlus)} : la dotation en plus reste dans l'entreprise`,
            juste: false,
            retour: `Non : une dotation ne sort ni ne garde d'argent ; seule l'économie d'impôt touche la trésorerie, ${eur(d.impotEnMoins)}, et elle n'est que décalée.`,
          },
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [2],
      type: "montants",
      titre: "Retrouver le stock à rebours",
      notions: ["stock"],
      question: (c) => {
        const x = clotureDeNova(c);
        return `Un confrère a clôturé le même exercice et trouve ${eur(x.peps.resultatAvantImpot)} de résultat avant impôt. Tout est identique, sauf la valeur du stock final. Retrouvez l'écart de résultat, le stock final qu'il a retenu, puis le coût d'un jeu en stock.`;
      },
      champs: (c) => {
        const x = clotureDeNova(c);
        return [
          { libelle: "Écart de résultat", attendu: x.peps.ecart, calcul: `${eur(x.peps.resultatAvantImpot)} − ${eur(x.resultatAvantImpot)} = ${eur(x.peps.ecart)}` },
          { libelle: "Stock final retenu", attendu: x.peps.stock, calcul: `${eur(x.stockFinal)} + ${eur(x.peps.ecart)} = ${eur(x.peps.stock)} : un stock plus élevé de l'écart, le résultat aussi` },
          { libelle: "Coût d'un jeu en stock", attendu: x.peps.coutUnitaire, calcul: `${eur(x.peps.stock)} ÷ ${qte(x.stock.final.quantite)} jeux = ${eur(x.peps.coutUnitaire)}` },
        ];
      },
      explication: (c) => {
        const x = clotureDeNova(c);
        return [
          `${eur(x.peps.coutUnitaire)} le jeu, c'est le prix du dernier lot : le confrère a valorisé le stock au premier entré, premier sorti, qui garde en magasin les jeux achetés en dernier. Quand les prix montent, cette méthode donne un stock plus élevé que le coût moyen, et un résultat plus élevé d'autant. Les deux sont permises ; ce qui ne l'est pas, c'est d'en changer d'un exercice à l'autre sans raison.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement", "stock", "depreciation", "loan_schedule"],
      tableau: (c) => tableauDuPassage(clotureDeNova(c)),
      texte: (c) => {
        const x = clotureDeNova(c);
        return [
          `Vous avez clôturé le premier exercice de ${x.f.entreprise} : la balance, la dotation, les intérêts courus à recevoir et à payer, le stock final, la facture non parvenue, puis l'impôt au taux réduit et au taux normal. Chaque travail rattache à l'exercice ce qui lui appartient ; aucun ne fait bouger la banque.`,
          `Les chapitres du palier suivant passent les autres travaux : la prudence (la créance d'un client en difficulté, un litige) et les régularisations (une prime payée d'avance, une livraison pas encore facturée, une facture pas encore livrée). Le résultat que ${x.f.entreprise} arrêtera viendra après eux.`,
          "Au niveau de l'examen, vous savez passer les écritures d'inventaire et en mesurer l'effet, calculer l'impôt au barème et distinguer son taux moyen de son taux marginal, chiffrer une variante de méthode et dire ce qu'elle change vraiment, et remonter d'un résultat à la valeur d'un stock.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Une charge appartient à l'exercice où elle naît, un produit à celui où il est acquis : la dotation, le stock consommé, les achats livrés, les intérêts courus se rattachent au 31 décembre, payés ou non. L'impôt vient en dernier : au taux réduit jusqu'au plafond, au taux normal au-delà ; une décision se juge au taux marginal.",
    },
  ],
};
