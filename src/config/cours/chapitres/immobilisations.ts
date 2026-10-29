import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { intituleDe } from "../../../pedagogy/cours/plan-comptable";
import type { Cas } from "../cas";
import { dateDuCours as date, moisEtJour } from "../dates";
import {
  auCentime,
  cession,
  coefficientDegressif,
  joursCompris,
  JOURS_DE_L_ANNEE,
  JOURS_DU_MOIS,
  planDAmortissement as planDuMonde,
  type DateDuCours,
  type Immobilisation,
  type ModeDAmortissement,
} from "../monde/amortissement";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : IMMOBILISATIONS ET AMORTISSEMENTS (comptabilité générale, palier 3 ; BTS CG, DCG UE9,
 * BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : l'équipement
 * de chaque entreprise est celui de son cas figé (monde/cas-des-entreprises.ts : son prix hors taxes,
 * sa mise en service le 6 janvier, sa durée d'utilisation), et ses plans se calculent par le modèle
 * du cours (monde/amortissement.ts : linéaire et dégressif, prorata, cession). Le chapitre se joue
 * dans les neuf entreprises du cours ; chez NOVA, la ligne de montage et sa dotation de 9 861,11 €
 * sont celles de la clôture (monde/exercice-de-nova.ts).
 *
 * L'objet : l'équipement de sa facture à sa revente. Ce qui entre dans son coût et ce qui est une
 * charge ; le plan linéaire, au prorata des jours la première année ; la dotation, qui ne sort pas
 * d'argent ; la revente, dont le résultat est le prix moins la valeur nette comptable ; puis le
 * dégressif fiscal, qui avance les charges sans en changer le total, et ne fait que décaler l'impôt.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, acquisition, plan, dotation (la formule est au repère ou dans la question, qui
 *     nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-revente
 *     puis le-prix-de-revente (un curseur sur le prix offert, face à la valeur nette comptable)
 *     avant revente ; predire-le-degressif puis le-laboratoire-du-plan (un levier à choix linéaire ou
 *     dégressif, la date de la revente, et le graphique des deux valeurs nettes face au prix offert)
 *     avant le-plan-degressif ;
 *   · autonome : charge-ou-immobilisation, le-cout-d-acquisition, tresorerie, annees-suivantes,
 *     revente (ni formule ni chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : le-plan-degressif (le plan fiscal complet, jusqu'au passage au linéaire),
 *     le-degressif-et-l-impot (la critique : l'impôt n'est que décalé, et l'amortissement
 *     dérogatoire), a-rebours (retrouver la date de mise en service à partir d'une valeur nette
 *     comptable) ; puis la synthèse.
 *
 * Ce qui a disparu : la revente au prix que l'arène en donnerait (une fraction de la valeur nette,
 * `ratioDeRevente`, qui faisait toujours une moins-value). Le repreneur offre ici une part du prix
 * neuf (PRIX_DE_L_OCCASION) : la revente fait une plus-value ou une moins-value selon l'entreprise et
 * le mode d'amortissement. Le calcul du plan ne passe plus par un taux arrondi (« 60 000 € × 16,67 %
 * = 10 000 € » faisait 10 002 €) : l'annuité est la valeur brute divisée par la durée.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE DEVIS D'UN ÉQUIPEMENT IDENTIQUE, hypothèse du cours : le fournisseur détaille ses lignes, en part
 * du prix catalogue hors taxes de l'équipement. Une remise sur le prix ; la livraison et l'installation
 * (avec les essais de mise en route), qui entrent dans le coût d'acquisition ; la formation de l'équipe
 * et le contrat d'entretien de la première année, qui sont des charges. Le cas « Un second
 * équipement » achète sur ce devis.
 */
export const DEVIS_DU_FOURNISSEUR = { remise: 0.05, livraison: 0.02, installation: 0.04, formation: 0.015, entretien: 0.025 } as const;

/** Le prix qu'offre un repreneur d'occasion, hypothèse du cours : 40 % du prix neuf hors taxes, à toute date. */
export const PRIX_DE_L_OCCASION = 0.4;

/** La date de la revente étudiée : le 30 juin de la 3e année d'utilisation (l'exercice 2, le premier étant 0). */
export const DATE_DE_REVENTE: DateDuCours = { jour: 30, mois: 6, exercice: 2 };

/** La mise en service de l'équipement du calcul à rebours : un équipement identique, mis en service le 21 septembre. */
export const MISE_EN_SERVICE_A_REBOURS: DateDuCours = { jour: 21, mois: 9 };

/** Le taux d'impôt sur les sociétés de la critique du dégressif : le taux normal, celui d'un bénéfice au-delà du taux réduit. */
export const TAUX_D_IMPOT = 0.25;

/** Les deux modes du levier à choix du laboratoire. */
export const MODES_DU_LABORATOIRE = { lineaire: 0, degressif: 1 } as const;

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS
// ─────────────────────────────────────────────────────────────────────────────

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const coef = (k: number) => k.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
/** « 3e année », « 1re année » : le rang d'un exercice du plan (0 pour le premier). */
export const anneeDuPlan = (exercice: number) => `${exercice + 1}${exercice === 0 ? "re" : "e"} année`;
/** Une date du plan, en mots : « 30 juin de la 3e année ». */
export const dateDuPlan = (d: DateDuCours) => `${d.jour === 1 ? "1er" : d.jour} ${MOIS[d.mois - 1]} de la ${anneeDuPlan(d.exercice ?? 0)}`;
/** « de NOVA », « d'ATLAS CONSEIL » : l'élision devant une voyelle. */
export const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** La fin du mois m de l'utilisation, comptée depuis janvier de la 1re année (1 pour janvier, 13 pour le janvier suivant). */
export const finDuMois = (m: number): DateDuCours => ({ jour: 30, mois: ((m - 1) % 12) + 1, exercice: Math.floor((m - 1) / 12) });
/** Le numéro du mois d'une date, compté comme `finDuMois`. */
const numeroDuMois = (d: DateDuCours) => (d.exercice ?? 0) * 12 + d.mois;

/** Le compte d'amortissement d'une immobilisation : 28 suivi de son numéro sans le 2. */
export const compteDAmortissement = (compte: string) => `28${compte.slice(1)}`;

/** L'équipement du cas, tel que le modèle l'amortit : sa valeur brute, sa mise en service, sa durée. */
export function equipementDe(c: Cas): Immobilisation {
  const { mois, jour } = moisEtJour(c.immobilisation.date);
  return { valeurBrute: c.immobilisation.ht, miseEnService: { jour, mois: mois + 1 }, dureeAns: c.gestion.dureeAmortissementMois / 12 };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE PLAN D'AMORTISSEMENT DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/** Le plan d'amortissement de l'équipement, linéaire et dégressif, sa revente, et tout ce que le chapitre et son cas demandent. */
export function planDAmortissement(c: Cas) {
  const i = c.immobilisation;
  const immo = equipementDe(c);
  const duree = immo.dureeAns;
  const base = immo.valeurBrute;
  const lineaire = planDuMonde(immo, "lineaire");
  const degressif = planDuMonde(immo, "degressif");
  const premiere = lineaire[0]!.dotation;

  // Le devis d'un équipement identique : ce qui entre dans son coût, ce qui va en charges.
  const d = DEVIS_DU_FOURNISSEUR;
  const devis = {
    prix: base,
    remise: auCentime(base * d.remise),
    livraison: auCentime(base * d.livraison),
    installation: auCentime(base * d.installation),
    formation: auCentime(base * d.formation),
    entretien: auCentime(base * d.entretien),
  };
  const prixNet = auCentime(devis.prix - devis.remise);
  const coutDAcquisition = auCentime(prixNet + devis.livraison + devis.installation);
  const chargesDuDevis = auCentime(devis.formation + devis.entretien);

  // La revente au 30 juin de la 3e année, au prix de l'occasion.
  const prixRevente = auCentime(base * PRIX_DE_L_OCCASION);
  const revente = cession(immo, "lineaire", DATE_DE_REVENTE, prixRevente);
  const reventeDegressive = cession(immo, "degressif", DATE_DE_REVENTE, prixRevente);

  // Le dégressif : son taux, et l'année où il passe au linéaire sur la valeur nette.
  const coefficient = coefficientDegressif(duree);
  const tauxDegressif = coefficient / duree;
  const passage = degressif.findIndex((l, k) => k > 0 && Math.abs(l.taux - tauxDegressif) > 1e-9);

  // Le laboratoire : la première fin de mois où le prix offert couvre la valeur nette, dans un mode.
  const derniereFin = 12 * duree;
  const premierMoisSans = (mode: ModeDAmortissement) => {
    for (let m = 1; m <= derniereFin; m++) if (cession(immo, mode, finDuMois(m), prixRevente).resultat >= 0) return m;
    return derniereFin;
  };

  // Le calcul à rebours : la valeur nette au 31 décembre d'un équipement identique, mis en service plus tard.
  const joursARebours = joursCompris(MISE_EN_SERVICE_A_REBOURS, { jour: 31, mois: 12 });
  const dotationARebours = auCentime(((base / duree) * joursARebours) / JOURS_DE_L_ANNEE);

  return {
    immo,
    base,
    duree,
    taux: 1 / duree,
    annuite: auCentime(base / duree),
    lineaire,
    degressif,
    joursPremiereAnnee: joursCompris(immo.miseEnService, { jour: 31, mois: 12 }),
    premiere,
    vncFinAnnee1: lineaire[0]!.valeurNette,
    deuxieme: lineaire[1]!.dotation,
    vncFinAnnee2: lineaire[1]!.valeurNette,
    derniere: lineaire.at(-1)!.dotation,
    derniereAnnee: lineaire.length,
    devis,
    prixNet,
    coutDAcquisition,
    chargesDuDevis,
    annuiteDuDevis: auCentime(coutDAcquisition / duree),
    joursRevente: joursCompris({ jour: 1, mois: 1, exercice: DATE_DE_REVENTE.exercice }, DATE_DE_REVENTE),
    dotationRevente: revente.dotationDeLAnnee,
    cumulRevente: revente.cumul,
    vncRevente: revente.valeurNette,
    prixRevente,
    resultatRevente: revente.resultat,
    vncReventeDegressive: reventeDegressive.valeurNette,
    resultatReventeDegressive: reventeDegressive.resultat,
    coefficient,
    tauxDegressif,
    moisPremiereAnneeDegressive: degressif[0]!.prorata,
    passage,
    baseAuPassage: degressif[passage]!.baseDeCalcul,
    annuiteApresPassage: degressif[passage]!.dotation,
    ecartPremiereAnnee: auCentime(degressif[0]!.dotation - premiere),
    impotDecale: auCentime((degressif[0]!.dotation - premiere) * TAUX_D_IMPOT),
    premierMoisDegressif: premierMoisSans("degressif"),
    premierMoisLineaire: premierMoisSans("lineaire"),
    moisDeLaRevente: numeroDuMois(DATE_DE_REVENTE),
    derniereFin,
    joursARebours,
    dotationARebours,
    vncARebours: auCentime(base - dotationARebours),
    compteAmortissement: compteDAmortissement(i.compte),
  };
}

export type PlanDuChapitre = ReturnType<typeof planDAmortissement>;

/** La revente au prix offert à la fin d'un mois quelconque, dans un mode : ce que le laboratoire montre. */
export function laboratoireDuPlan(p: PlanDuChapitre, mode: ModeDAmortissement, mois: number) {
  const m = Math.min(p.derniereFin, Math.max(1, Math.round(mois)));
  const r = cession(p.immo, mode, finDuMois(m), p.prixRevente);
  return { dotations: r.cumul, valeurNette: r.valeurNette, resultat: r.resultat, total: auCentime(r.resultat - r.cumul) };
}

const modeDe = (v: number): ModeDAmortissement => (v === MODES_DU_LABORATOIRE.degressif ? "degressif" : "lineaire");

/** La facture de l'équipement et sa durée : le document de départ. */
function tableauDeLaFacture(c: Cas, p: PlanDuChapitre): TableauDeDonnees {
  const i = c.immobilisation;
  return {
    titre: `La facture de l'équipement ${dE(c.entreprise)}`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: `${i.designation}, prix hors taxes`, valeurs: [eur(i.ht)] },
      { libelle: `TVA à ${pct(i.tauxTva)}`, valeurs: [eur(i.tva)] },
      { libelle: "Total réglé par virement", valeurs: [eur(i.ttc)] },
      { libelle: "Mise en service", valeurs: [date(i.date)] },
      { libelle: "Durée d'utilisation", valeurs: [`${qte(p.duree)} ans`] },
    ],
  };
}

/** Le devis d'un équipement identique, ligne à ligne. */
export function tableauDuDevis(c: Cas, p: PlanDuChapitre): TableauDeDonnees {
  const d = p.devis;
  return {
    titre: `Le devis d'un équipement identique · ${c.entreprise}`,
    colonnes: ["Hors taxes"],
    lignes: [
      { libelle: `${c.immobilisation.designation}, prix catalogue`, valeurs: [eur(d.prix)] },
      { libelle: `Remise de ${pct(DEVIS_DU_FOURNISSEUR.remise)} sur le prix`, valeurs: [eur(-d.remise)] },
      { libelle: "Livraison", valeurs: [eur(d.livraison)] },
      { libelle: "Installation et essais de mise en route", valeurs: [eur(d.installation)] },
      { libelle: "Formation de l'équipe", valeurs: [eur(d.formation)] },
      { libelle: "Contrat d'entretien de la première année", valeurs: [eur(d.entretien)] },
    ],
  };
}

/** Le plan linéaire et le plan dégressif, année par année. */
function tableauDesDeuxPlans(p: PlanDuChapitre): TableauDeDonnees {
  const lignes = p.lineaire.map((l, k) => {
    const d = p.degressif[k];
    return { libelle: anneeDuPlan(k), valeurs: [eur(l.dotation), eur(l.valeurNette), d ? eur(d.dotation) : "", d ? eur(d.valeurNette) : ""] };
  });
  return { titre: "Les deux plans d'amortissement", colonnes: ["Dotation linéaire", "Valeur nette en linéaire", "Dotation dégressive", "Valeur nette en dégressif"], lignes };
}

export const IMMOBILISATIONS: Chapitre = {
  code: "immobilisations",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [
    "BTS CG P2 · Contrôle et production de l'information financière",
    "DCG UE9 · Comptabilité",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "Immobilisations et amortissements",
  accroche:
    "L'équipement de l'entreprise, de sa facture à sa revente : ce qui entre dans son coût, ce qu'il coûte chaque année en linéaire ou en dégressif, ce que vaut ce qui en reste, et pourquoi l'amortissement ne sort pas d'argent.",
  objectifs: [
    "Distinguer ce qui entre dans le coût d'une immobilisation et ce qui est une charge",
    "Bâtir un plan d'amortissement linéaire, avec le prorata de la première année",
    "Enregistrer la dotation aux amortissements et lire la valeur nette comptable",
    "Calculer le résultat d'une cession : le prix face à la valeur nette comptable",
    "Bâtir un plan dégressif et dire ce qu'il change au résultat et à l'impôt",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un équipement qui s'use",
      notions: ["depreciation"],
      tableau: (c) => tableauDeLaFacture(c, planDAmortissement(c)),
      texte: (c) => {
        const p = planDAmortissement(c);
        return [
          `Ce chapitre se joue dans la simulation du cours. Le ${date(c.immobilisation.date)}, ${c.entreprise} achète et met en service son équipement : ${c.immobilisation.designation}, ${eur(p.base)} hors taxes. La simulation suppose qu'il sert ${qte(p.duree)} ans.`,
          "Le premier chapitre l'a mis à l'actif sans toucher au résultat. Mais l'entreprise le consomme peu à peu : chaque année, une part de sa valeur devient une charge, la dotation aux amortissements. C'est ainsi que son coût se répartit sur les années où il sert.",
          `La simulation compte le temps comme les énoncés de comptabilité : des mois de ${qte(JOURS_DU_MOIS)} jours, une année de ${qte(JOURS_DE_L_ANNEE)} jours, le jour de la mise en service compté. Le plan de l'entreprise est linéaire. Le dégressif, que le fisc ouvre aux biens d'équipement neufs et que la simulation suppose permis ici, vient ensuite, avec son coefficient légal et au prorata des mois.`,
        ];
      },
      repere: () =>
        "Amortir, c'est répartir le coût d'un équipement sur sa durée d'utilisation. La dotation est une charge, mais elle ne fait sortir aucun argent : l'équipement a été payé à l'achat.",
    },
    {
      id: "acquisition",
      objectifs: [0],
      type: "ecriture",
      titre: "L'achat de l'équipement",
      notions: ["depreciation"],
      evenement: (c) =>
        `Le ${date(c.immobilisation.date)}, ${c.entreprise} reçoit son équipement (${c.immobilisation.designation}) et règle la facture par virement : ${eur(c.immobilisation.ht)} hors taxes, ${eur(c.immobilisation.tva)} de TVA.`,
      ecriture: (c) => ({
        date: date(c.immobilisation.date),
        libelle: `Achat : ${c.immobilisation.designation}`,
        lignes: [
          { role: "l'équipement, au prix hors taxes", compte: c.immobilisation.compte, acceptes: c.immobilisation.acceptes, sens: "debit", montant: c.immobilisation.ht, indice: "le montant hors taxes de la facture" },
          { role: "la TVA déductible", compte: "44562", acceptes: ["44566"], sens: "debit", montant: c.immobilisation.tva, indice: "le montant de TVA de la facture" },
          { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.immobilisation.ttc, indice: "le montant réglé, taxes comprises" },
        ],
      }),
      indices: (c) => [
        `Un équipement qui servira plusieurs années : une immobilisation, classe 2. Cherchez le compte qui correspond à « ${c.immobilisation.designation} ».`,
        "La TVA sur une immobilisation se déduit : TVA déductible sur immobilisations. La banque paie le total.",
      ],
      explication: (c) => [`L'équipement entre à l'actif pour ${eur(c.immobilisation.ht)} : c'est sa valeur brute, celle sur laquelle il s'amortira.`],
      vue: "immobilisation",
    },
    {
      id: "charge-ou-immobilisation",
      objectifs: [0],
      type: "tri",
      titre: "Dans le coût, ou en charges",
      notions: ["depreciation"],
      question: (c) =>
        `${c.entreprise} demande au fournisseur le devis d'un équipement identique. Rangez chaque ligne : entre-t-elle dans le coût de l'équipement, qui s'amortira, ou va-t-elle en charges de l'exercice ?`,
      categories: [
        { code: "actif", libelle: "Dans le coût de l'équipement" },
        { code: "charge", libelle: "En charges de l'exercice" },
      ],
      elements: (c) => {
        const d = planDAmortissement(c).devis;
        return [
          { libelle: "Le prix catalogue", montant: d.prix, categorie: "actif", pourquoi: "Le prix d'achat est le cœur du coût d'acquisition." },
          { libelle: "La remise sur le prix", montant: -d.remise, categorie: "actif", pourquoi: "Une remise obtenue à l'achat vient en moins du coût : l'équipement entre à l'actif pour son prix net." },
          { libelle: "La livraison", montant: d.livraison, categorie: "actif", pourquoi: "Sans transport, l'équipement ne serait pas là où il doit servir : des frais accessoires, dans le coût." },
          {
            libelle: "L'installation et les essais de mise en route",
            montant: d.installation,
            categorie: "actif",
            pourquoi: "Ce qu'il faut pour mettre l'équipement en état de fonctionner entre dans son coût, essais compris.",
          },
          {
            libelle: "La formation de l'équipe",
            montant: d.formation,
            categorie: "charge",
            pourquoi: "Le plan comptable exclut du coût d'une immobilisation la formation du personnel : elle sert l'équipe, pas la mise en état de l'équipement.",
          },
          {
            libelle: "Le contrat d'entretien de la première année",
            montant: d.entretien,
            categorie: "charge",
            pourquoi: "L'entretien garde l'équipement en état ; il n'en augmente ni la valeur ni la durée. C'est une charge de l'année qu'il couvre.",
          },
        ];
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `Le coût d'acquisition, c'est le prix net de remise et les frais nécessaires pour que l'équipement serve : ${eur(p.coutDAcquisition)}. La formation et l'entretien, ${eur(p.chargesDuDevis)}, pèsent tout de suite sur le résultat de l'année.`,
        ];
      },
    },
    {
      id: "le-cout-d-acquisition",
      objectifs: [0],
      type: "montants",
      titre: "Le coût d'acquisition",
      notions: ["depreciation"],
      tableau: (c) => tableauDuDevis(c, planDAmortissement(c)),
      question: (c) =>
        `Sur ce devis, que vaudrait l'équipement à l'actif, et que coûterait le reste au résultat de l'année ? Puis son annuité d'une année pleine, en linéaire sur ${qte(planDAmortissement(c).duree)} ans.`,
      champs: (c) => {
        const p = planDAmortissement(c);
        const d = p.devis;
        return [
          { libelle: "Prix net, après la remise", attendu: p.prixNet, calcul: `${eur(d.prix)} − ${eur(d.remise)} = ${eur(p.prixNet)}` },
          {
            libelle: "Coût d'acquisition de l'équipement",
            attendu: p.coutDAcquisition,
            calcul: `${eur(p.prixNet)} + ${eur(d.livraison)} de livraison + ${eur(d.installation)} d'installation = ${eur(p.coutDAcquisition)}`,
          },
          { libelle: "Charges de l'exercice", attendu: p.chargesDuDevis, calcul: `${eur(d.formation)} de formation + ${eur(d.entretien)} d'entretien = ${eur(p.chargesDuDevis)}` },
          { libelle: "Annuité linéaire d'une année pleine", attendu: p.annuiteDuDevis, calcul: `${eur(p.coutDAcquisition)} ÷ ${qte(p.duree)} = ${eur(p.annuiteDuDevis)}` },
        ];
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `Le prix catalogue, ${eur(p.devis.prix)}, n'est pas le coût de l'équipement : la remise le baisse, les frais de mise en service le montent. C'est sur ${eur(p.coutDAcquisition)} qu'il s'amortirait, à ${eur(p.annuiteDuDevis)} par année pleine.`,
          "Passer l'installation en charges ferait un résultat plus bas cette année et plus haut les suivantes : une erreur de rattachement, qu'un contrôle fiscal redresse.",
        ];
      },
    },
    {
      id: "plan",
      objectifs: [1],
      type: "montants",
      titre: "Le plan d'amortissement",
      notions: ["depreciation"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `Base amortissable : ${eur(p.base)}. Durée d'utilisation : ${qte(p.duree)} ans, amortissement linéaire. Mise en service le ${date(c.immobilisation.date)}. Calculez la première année du plan : le taux (100 % ÷ la durée), l'annuité (la base ÷ la durée), les jours d'utilisation (mois de ${qte(JOURS_DU_MOIS)} jours, le jour de la mise en service compté), la dotation (l'annuité × les jours ÷ ${qte(JOURS_DE_L_ANNEE)}), puis la valeur nette comptable.`;
      },
      champs: (c) => {
        const p = planDAmortissement(c);
        const { jour } = moisEtJour(c.immobilisation.date);
        return [
          { libelle: "Taux d'amortissement, en %", attendu: auCentime(p.taux * 100), calcul: `100 % ÷ ${qte(p.duree)} ans = ${pct(p.taux)}` },
          { libelle: "Annuité d'une année pleine", attendu: p.annuite, calcul: `${eur(p.base)} ÷ ${qte(p.duree)} = ${eur(p.annuite)}` },
          {
            libelle: "Jours d'utilisation la première année",
            attendu: p.joursPremiereAnnee,
            calcul: `du ${jour} au ${JOURS_DU_MOIS} janvier, ${qte(JOURS_DU_MOIS - jour + 1)} jours, puis 11 mois de ${qte(JOURS_DU_MOIS)} jours : ${qte(p.joursPremiereAnnee)} jours`,
          },
          { libelle: "Dotation de la première année", attendu: p.premiere, calcul: `${eur(p.annuite)} × ${qte(p.joursPremiereAnnee)} ÷ ${qte(JOURS_DE_L_ANNEE)} = ${eur(p.premiere)}` },
          { libelle: "Valeur nette comptable au 31 décembre", attendu: p.vncFinAnnee1, calcul: `${eur(p.base)} − ${eur(p.premiere)} = ${eur(p.vncFinAnnee1)}` },
        ];
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `L'équipement n'a servi que ${qte(p.joursPremiereAnnee)} jours sur ${qte(JOURS_DE_L_ANNEE)} : la première dotation, ${eur(p.premiere)}, est un peu moins qu'une annuité pleine. Ce qui manque sera pris la dernière année.`,
          `Au 31 décembre, l'équipement vaut ${eur(p.vncFinAnnee1)} dans les comptes : sa valeur nette comptable, la valeur brute moins les amortissements.`,
        ];
      },
    },
    {
      id: "dotation",
      objectifs: [2],
      type: "ecriture",
      titre: "La dotation du 31 décembre",
      notions: ["depreciation"],
      evenement: (c) => `Le 31 décembre, le comptable ${dE(c.entreprise)} enregistre l'amortissement de l'année : ${eur(planDAmortissement(c).premiere)}.`,
      ecriture: (c) => {
        const p = planDAmortissement(c);
        const compte = c.immobilisation.compte;
        return {
          date: "31 décembre",
          libelle: "Dotation aux amortissements de l'année",
          lignes: [
            { role: "la charge de l'année, la dotation", compte: "6811", acceptes: ["681"], sens: "debit", montant: p.premiere, indice: "la dotation de la première année" },
            {
              role: "l'amortissement de l'équipement",
              compte: p.compteAmortissement,
              acceptes: [`28${compte.slice(1, 3)}`, "281"],
              sens: "credit",
              montant: p.premiere,
              indice: "la dotation de la première année",
            },
          ],
        };
      },
      indices: (c) => [
        "Au débit, une charge : les dotations aux amortissements, classe 6.",
        `Au crédit, pas le compte de l'équipement : on garde sa valeur d'achat intacte, et l'on cumule l'usure à part, dans un compte d'amortissement. Son numéro : 28, puis celui de l'équipement sans le 2 (${c.immobilisation.compte}).`,
      ],
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `Le compte ${c.immobilisation.compte} garde ${eur(p.base)}, ce que l'équipement a coûté. Le compte ${p.compteAmortissement} (${intituleDe(p.compteAmortissement)}) porte l'usure cumulée : au bilan, il vient en moins, et l'équipement apparaît pour sa valeur nette, ${eur(p.vncFinAnnee1)}.`,
        ];
      },
      vue: "immobilisation",
    },
    {
      id: "tresorerie",
      objectifs: [2],
      type: "choix",
      titre: "Une charge sans argent",
      notions: ["depreciation", "net_treasury"],
      question: (c) => `La dotation de ${eur(planDAmortissement(c).premiere)} fait baisser le résultat de l'année. Fait-elle aussi baisser la banque ?`,
      options: (c) => [
        { texte: "Oui, de la même somme : une charge se paie.", juste: false, retour: `Pas celle-ci. Personne n'est payé le 31 décembre : l'équipement l'a été le ${date(c.immobilisation.date)}, en une fois.` },
        {
          texte: "Non : l'argent est sorti à l'achat. La dotation répartit ce coût sur les années, sans nouveau paiement.",
          juste: true,
          retour:
            "C'est cela. Une dotation est une charge calculée, pas décaissée. C'est pourquoi une entreprise peut afficher une perte et garder de la trésorerie, et pourquoi l'analyse financière rajoute les dotations au résultat pour mesurer ce que l'activité dégage vraiment.",
        },
        {
          texte: "Non, mais elle la fera baisser à la fin de la durée d'utilisation, quand il faudra remplacer l'équipement.",
          juste: false,
          retour: "Remplacer l'équipement sera un nouvel achat, une nouvelle immobilisation. La dotation, elle, ne sort jamais d'argent.",
        },
      ],
      vue: "resultat",
    },
    {
      id: "annees-suivantes",
      objectifs: [1, 2],
      type: "montants",
      titre: "La suite du plan",
      notions: ["depreciation"],
      question: (c) => `Prolongez le plan d'amortissement jusqu'au bout. L'équipement aura servi ${qte(planDAmortissement(c).duree)} ans quand il sera entièrement amorti.`,
      champs: (c) => {
        const p = planDAmortissement(c);
        return [
          { libelle: "Dotation de la deuxième année", attendu: p.deuxieme, calcul: `une année pleine : ${eur(p.annuite)}` },
          { libelle: "Valeur nette comptable à la fin de la deuxième année", attendu: p.vncFinAnnee2, calcul: `${eur(p.base)} − ${eur(p.premiere)} − ${eur(p.deuxieme)} = ${eur(p.vncFinAnnee2)}` },
          {
            libelle: "Numéro de la dernière année d'amortissement",
            attendu: p.derniereAnnee,
            calcul: `une première année partielle, ${qte(p.duree - 1)} années pleines, puis une dernière année : la ${anneeDuPlan(p.derniereAnnee - 1)}`,
          },
          { libelle: "Dotation de la dernière année", attendu: p.derniere, calcul: `${eur(p.base)} − ${eur(p.premiere)} − ${qte(p.duree - 1)} × ${eur(p.annuite)} = ${eur(p.derniere)}` },
        ];
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `Le plan s'étale sur ${qte(p.derniereAnnee)} exercices pour ${qte(p.duree)} ans d'utilisation : la première et la dernière année se partagent une annuité. Au bout du compte, les dotations font exactement ${eur(p.base)}, et la valeur nette comptable tombe à zéro.`,
        ];
      },
    },
    {
      id: "predire-la-revente",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur la revente",
      notions: ["depreciation"],
      question: (c) =>
        `Avant de calculer, pariez. Un repreneur s'intéresse à l'équipement d'occasion, le ${dateDuPlan(DATE_DE_REVENTE)}. ${c.entreprise} le revendrait avec un bénéfice, une plus-value, dès que son prix dépasse…`,
      options: () => {
        const voir = "Faites varier le prix à l'étape suivante : le curseur montre où passe la frontière.";
        return [
          { texte: "La valeur nette comptable de l'équipement ce jour-là", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Le prix payé à l'achat, hors taxes", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Zéro : l'équipement est payé, tout prix est un gain", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-prix-de-revente",
      objectifs: [3],
      type: "curseur",
      titre: "Le prix de revente au curseur",
      notions: ["depreciation"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `Faites varier le prix de revente, de 0 à ${eur(p.base)}. Une droite donne le prix, l'autre la valeur nette comptable de l'équipement le ${dateDuPlan(DATE_DE_REVENTE)}, une fois amorti jusqu'à ce jour. Placez le curseur sur le plus petit prix qui ne fait pas de moins-value, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix de revente, hors taxes", unite: "€" }),
      cible: (c) => {
        const p = planDAmortissement(c);
        return { attendu: Math.ceil(p.vncRevente - 1e-9), min: 0, max: p.base };
      },
      zones: ["Plus-value", "Moins-value"],
      rates: () => ({
        dessous: "À ce prix, l'acheteur paie moins que ce que l'équipement vaut encore dans les comptes : une moins-value.",
        dessus: "Ce prix couvre la valeur nette, mais un prix plus bas la couvre aussi : cherchez le plus petit.",
      }),
      montrer: "Montrer la frontière",
      lecture: (c, prix) => {
        const p = planDAmortissement(c);
        return [
          { libelle: "Prix de revente", montant: prix },
          { libelle: "Valeur nette comptable à la revente", montant: p.vncRevente },
          { libelle: "Résultat de cession", montant: auCentime(prix - p.vncRevente), fort: true },
          { libelle: "Charges de l'équipement, de l'achat à la revente", montant: auCentime(p.base - prix) },
        ];
      },
      droites: (c) => {
        const p = planDAmortissement(c);
        return { produit: (x) => x, cout: () => p.vncRevente, libelles: ["Prix de revente", "Valeur nette comptable à la revente"] };
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `La frontière est la valeur nette comptable, ${eur(p.vncRevente)} : au-dessus, une plus-value ; en dessous, une moins-value. Le prix d'achat, ${eur(p.base)}, ne compte plus : les amortissements en ont déjà passé ${eur(p.cumulRevente)} en charges.`,
          "La dernière ligne ne suit que le prix : les dotations, moins le résultat de cession, font toujours le prix d'achat moins le prix de revente. Une plus-value n'est pas un gain de plus ; elle dit que l'amortissement est allé plus vite que la perte de valeur.",
        ];
      },
    },
    {
      id: "revente",
      objectifs: [3],
      type: "montants",
      titre: "Le résultat de la revente",
      notions: ["depreciation"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `Le repreneur offre ${pct(PRIX_DE_L_OCCASION)} du prix neuf, ${eur(p.prixRevente)}, pour une revente le ${dateDuPlan(DATE_DE_REVENTE)}. Calculez ce que donne la revente, négatif pour une moins-value.`;
      },
      champs: (c) => {
        const p = planDAmortissement(c);
        return [
          {
            libelle: `Dotation de la ${anneeDuPlan(DATE_DE_REVENTE.exercice ?? 0)}, jusqu'au ${DATE_DE_REVENTE.jour} ${MOIS[DATE_DE_REVENTE.mois - 1]}`,
            attendu: p.dotationRevente,
            calcul: `${eur(p.annuite)} × ${qte(p.joursRevente)} ÷ ${qte(JOURS_DE_L_ANNEE)} = ${eur(p.dotationRevente)}`,
          },
          { libelle: "Amortissements cumulés à la revente", attendu: p.cumulRevente, calcul: `${eur(p.premiere)} + ${eur(p.deuxieme)} + ${eur(p.dotationRevente)} = ${eur(p.cumulRevente)}` },
          { libelle: "Valeur nette comptable à la revente", attendu: p.vncRevente, calcul: `${eur(p.base)} − ${eur(p.cumulRevente)} = ${eur(p.vncRevente)}` },
          { libelle: "Résultat de cession", attendu: p.resultatRevente, calcul: `${eur(p.prixRevente)} − ${eur(p.vncRevente)} = ${eur(p.resultatRevente)}` },
        ];
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        const sens = p.resultatRevente >= 0 ? `une plus-value de ${eur(p.resultatRevente)}` : `une moins-value de ${eur(-p.resultatRevente)}`;
        return [
          `Avant de sortir l'équipement des comptes, on l'amortit jusqu'au jour de la revente. Il vaut alors ${eur(p.vncRevente)} ; le repreneur en donne ${eur(p.prixRevente)} : ${sens}. Au journal, la valeur nette sort en charge (675, valeur comptable des éléments d'actif cédés) et le prix entre en produit (775, produits des cessions d'éléments d'actif).`,
        ];
      },
    },
    {
      id: "predire-le-degressif",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur le dégressif",
      notions: ["depreciation"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `Pariez encore. Le fisc permet d'amortir l'équipement en dégressif : un taux plus fort, appliqué chaque année à la valeur nette. Le ${dateDuPlan(DATE_DE_REVENTE)}, face aux ${eur(p.vncRevente)} du plan linéaire, la valeur nette comptable ${dE(c.entreprise)} serait…`;
      },
      options: () => {
        const voir = "Le laboratoire de l'étape suivante bascule d'un mode à l'autre et trace les deux valeurs nettes.";
        return [
          { texte: "Plus basse : les premières années portent plus de charges", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Plus haute : un taux appliqué à la valeur nette baisse chaque année", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "La même : le total amorti ne dépend pas du mode", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-plan",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du plan",
      notions: ["depreciation"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `Le repreneur tient son offre, ${eur(p.prixRevente)}, quelle que soit la date. Choisissez le mode d'amortissement et la fin de mois de la revente, comptée depuis janvier de la 1re année : le tableau suit les dotations cumulées, la valeur nette et le résultat de cession ; le graphique trace les deux valeurs nettes face au prix offert.`;
      },
      leviers: (c) => {
        const p = planDAmortissement(c);
        return [
          {
            code: "mode",
            libelle: "Le mode d'amortissement",
            unite: "",
            min: MODES_DU_LABORATOIRE.lineaire,
            max: MODES_DU_LABORATOIRE.degressif,
            pas: 1,
            depart: MODES_DU_LABORATOIRE.lineaire,
            choix: [
              { valeur: MODES_DU_LABORATOIRE.lineaire, libelle: "Linéaire" },
              { valeur: MODES_DU_LABORATOIRE.degressif, libelle: `Dégressif, coefficient ${coef(p.coefficient)}` },
            ],
          },
          { code: "mois", libelle: "Revente à la fin du mois n°", unite: "mois", min: 1, max: p.derniereFin, pas: 1, depart: p.moisDeLaRevente },
        ];
      },
      lecture: (c, x) => {
        const p = planDAmortissement(c);
        const l = laboratoireDuPlan(p, modeDe(x.mode!), x.mois!);
        const d = laboratoireDuPlan(p, "lineaire", p.moisDeLaRevente);
        return [
          { libelle: "Dotations cumulées jusqu'à la revente", montant: l.dotations, reference: d.dotations },
          { libelle: "Valeur nette comptable à la revente", montant: l.valeurNette, reference: d.valeurNette },
          { libelle: "Prix offert", montant: p.prixRevente, reference: p.prixRevente },
          { libelle: "Résultat de cession", montant: l.resultat, reference: d.resultat, effet: true },
          { libelle: "Dotations et résultat de cession réunis", montant: l.total, reference: d.total, effet: true, fort: true },
        ];
      },
      // Les deux valeurs nettes selon la date de la revente : une droite en linéaire, une courbe qui
      // plonge puis s'aplatit en dégressif ; le prix offert les coupe à des dates différentes.
      graphique: (c) => {
        const p = planDAmortissement(c);
        return {
          levier: "mois",
          courbes: [
            { libelle: "Valeur nette en linéaire", valeur: (x) => laboratoireDuPlan(p, "lineaire", x.mois!).valeurNette },
            { libelle: "Valeur nette en dégressif", valeur: (x) => laboratoireDuPlan(p, "degressif", x.mois!).valeurNette },
            { libelle: "Prix offert", valeur: () => p.prixRevente },
          ],
        };
      },
      defi: (c) => {
        const p = planDAmortissement(c);
        return {
          consigne: "Revendez au prix offert sans moins-value, à la première fin de mois où c'est possible, dans l'un ou l'autre mode.",
          atteint: (x) => x.mois! <= p.premierMoisDegressif && laboratoireDuPlan(p, modeDe(x.mode!), x.mois!).resultat >= 0,
          indice: (x) => {
            const l = laboratoireDuPlan(p, modeDe(x.mode!), x.mois!);
            if (l.resultat < 0)
              return `À cette date, l'équipement vaut encore ${eur(l.valeurNette)} dans les comptes : le prix offert fait une moins-value de ${eur(-l.resultat)}. Revendez plus tard, ou amortissez plus vite.`;
            return "Pas de moins-value ici, mais une revente plus tôt est possible : regardez où la courbe du dégressif passe sous le prix offert.";
          },
          solution: { mode: MODES_DU_LABORATOIRE.degressif, mois: p.premierMoisDegressif },
        };
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        const d = laboratoireDuPlan(p, "degressif", p.premierMoisDegressif);
        return [
          `En dégressif, la valeur nette passe sous le prix offert dès la fin du mois n° ${qte(p.premierMoisDegressif)} (${eur(d.valeurNette)}) ; en linéaire, il faut attendre le mois n° ${qte(p.premierMoisLineaire)}. La courbe du dégressif plonge d'abord, puis s'aplatit : un taux fixe sur une valeur qui baisse, puis le linéaire sur ce qui reste.`,
          `Regardez la dernière ligne : à une même date, elle ne dépend pas du mode. Le dégressif met plus de charges en dotations et moins en moins-value, mais le total reste le prix offert moins le prix d'achat, ${eur(auCentime(p.prixRevente - p.base))}. Le mode d'amortissement déplace le résultat d'une année à l'autre ; il ne le change pas sur la vie de l'équipement.`,
        ];
      },
    },
    {
      id: "le-plan-degressif",
      objectifs: [4],
      type: "montants",
      titre: "Le plan dégressif",
      notions: ["depreciation"],
      tableau: (c) => tableauDesDeuxPlans(planDAmortissement(c)),
      question: (c) => {
        const p = planDAmortissement(c);
        return `Bâtissez le plan dégressif fiscal de l'équipement : coefficient de ${coef(p.coefficient)} pour ${qte(p.duree)} ans, la première année comptée en mois à partir du 1er du mois de la mise en service, et le passage au linéaire sur la valeur nette dès que le taux linéaire des années restantes dépasse le taux dégressif.`;
      },
      champs: (c) => {
        const p = planDAmortissement(c);
        const [d1, d2] = p.degressif;
        const passeEnDeuxiemeAnnee = p.passage === 1;
        const restantes = p.duree - p.passage;
        return [
          { libelle: "Taux dégressif, en %", attendu: auCentime(p.tauxDegressif * 100), calcul: `100 % ÷ ${qte(p.duree)} × ${coef(p.coefficient)} = ${pct(p.tauxDegressif)}` },
          {
            libelle: "Dotation dégressive de la première année",
            attendu: d1!.dotation,
            calcul: `${eur(p.base)} × ${coef(p.coefficient)} ÷ ${qte(p.duree)} × ${qte(p.moisPremiereAnneeDegressive)} mois ÷ 12 = ${eur(d1!.dotation)}`,
          },
          {
            libelle: "Dotation dégressive de la deuxième année",
            attendu: d2!.dotation,
            calcul: passeEnDeuxiemeAnnee
              ? `il reste ${qte(p.duree - 1)} ans : le taux linéaire, ${pct(1 / (p.duree - 1))}, dépasse déjà ${pct(p.tauxDegressif)}, d'où ${eur(d1!.valeurNette)} ÷ ${qte(p.duree - 1)} = ${eur(d2!.dotation)}`
              : `${eur(d1!.valeurNette)} × ${coef(p.coefficient)} ÷ ${qte(p.duree)} = ${eur(d2!.dotation)}`,
          },
          {
            libelle: "Numéro de l'année du passage au linéaire",
            attendu: p.passage + 1,
            calcul: `la ${anneeDuPlan(p.passage)} : il reste ${qte(restantes)} ans, et ${pct(1 / restantes)} dépasse ${pct(p.tauxDegressif)} ; l'année d'avant, ${pct(1 / (restantes + 1))} ne le dépassait pas`,
          },
          {
            libelle: "Dotation de chaque année après le passage",
            attendu: p.annuiteApresPassage,
            calcul: `${eur(p.baseAuPassage)} ÷ ${qte(restantes)} = ${eur(p.annuiteApresPassage)}, la dernière année soldant les centimes`,
          },
        ];
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `En dégressif, la première année porte ${eur(p.degressif[0]!.dotation)} de charges contre ${eur(p.premiere)} en linéaire : ${eur(p.ecartPremiereAnnee)} de plus. Le plan tient en ${qte(p.duree)} exercices, le linéaire en ${qte(p.derniereAnnee)}, et les deux font ${eur(p.base)} au total.`,
          "Le passage au linéaire n'est pas une option : un taux fixe sur une valeur qui baisse n'amortirait jamais tout. On bascule dès que diviser ce qui reste par les années restantes donne plus.",
        ];
      },
    },
    {
      id: "le-degressif-et-l-impot",
      objectifs: [4],
      type: "choix",
      titre: "Le dégressif et l'impôt",
      notions: ["depreciation", "income_statement"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `Le dirigeant ${dE(c.entreprise)} veut passer en dégressif : « ${eur(p.ecartPremiereAnnee)} de charges en plus cette année, c'est ${eur(p.impotDecale)} d'impôt en moins au taux de ${pct(TAUX_D_IMPOT)}. » Qu'en dites-vous ?`;
      },
      options: (c) => {
        const p = planDAmortissement(c);
        return [
          {
            texte: `L'impôt est décalé, pas économisé : les dernières années porteront moins de dotations, ${eur(p.base)} au total dans les deux plans`,
            juste: true,
            retour: `Oui. Sur la vie de l'équipement, les deux plans font ${eur(p.base)} de charges : le dégressif avance ${eur(p.impotDecale)} d'impôt d'un an ou deux, un gain de trésorerie, pas de résultat. Et le plan comptable doit suivre l'usure réelle : si elle est régulière, il reste linéaire, et le supplément fiscal se passe à part, en amortissement dérogatoire (6872 au débit, 145 au crédit), une provision réglementée.`,
          },
          {
            texte: `Il a raison : ${eur(p.impotDecale)} d'impôt économisés pour de bon`,
            juste: false,
            retour: `Non : une charge avancée est une charge en moins plus tard. Les dotations dégressives des dernières années sont plus faibles que les linéaires ; l'impôt rattrape les ${eur(p.impotDecale)}.`,
          },
          {
            texte: `Il gagne aussi ${eur(p.ecartPremiereAnnee)} de trésorerie, la dotation en plus`,
            juste: false,
            retour: "Non : une dotation ne sort pas d'argent, plus forte ou plus faible. Seul l'impôt décalé touche la banque.",
          },
          {
            texte: "Il ne peut pas : le dégressif est interdit pour un bien mis en service en cours d'année",
            juste: false,
            retour: "Non : le dégressif se compte alors en mois, du 1er du mois de la mise en service. Il est ouvert aux biens d'équipement neufs d'au moins 3 ans de durée, ce que la simulation suppose ici.",
          },
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [1],
      type: "montants",
      titre: "Retrouver la mise en service à rebours",
      notions: ["depreciation"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `Un équipement identique, même valeur brute (${eur(p.base)}) et même durée en linéaire, figure au bilan du 31 décembre de sa première année pour une valeur nette de ${eur(p.vncARebours)}. Retrouvez sa dotation de l'année, ses jours d'utilisation, puis la date de sa mise en service.`;
      },
      champs: (c) => {
        const p = planDAmortissement(c);
        const d = MISE_EN_SERVICE_A_REBOURS;
        const moisPleins = 12 - d.mois;
        const joursDuPremierMois = p.joursARebours - moisPleins * JOURS_DU_MOIS;
        return [
          { libelle: "Dotation de la première année", attendu: p.dotationARebours, calcul: `${eur(p.base)} − ${eur(p.vncARebours)} = ${eur(p.dotationARebours)}` },
          {
            libelle: "Jours d'utilisation",
            attendu: p.joursARebours,
            calcul: `${eur(p.dotationARebours)} × ${qte(JOURS_DE_L_ANNEE)} ÷ ${eur(p.annuite)} d'annuité = ${qte(p.joursARebours)} jours`,
          },
          {
            libelle: "Mois de la mise en service, de 1 à 12",
            attendu: d.mois,
            calcul: `${qte(p.joursARebours)} jours, c'est ${qte(moisPleins)} mois pleins (${qte(moisPleins * JOURS_DU_MOIS)} jours) et ${qte(joursDuPremierMois)} jours du mois d'avant : ${MOIS[d.mois - 1]}, le mois n° ${qte(d.mois)}`,
          },
          {
            libelle: "Jour du mois de la mise en service",
            attendu: d.jour,
            calcul: `${qte(joursDuPremierMois)} jours jusqu'au ${JOURS_DU_MOIS}, le jour de départ compté : ${qte(JOURS_DU_MOIS)} − ${qte(joursDuPremierMois)} + 1 = ${qte(d.jour)}`,
          },
        ];
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `L'équipement a été mis en service le ${MISE_EN_SERVICE_A_REBOURS.jour} ${MOIS[MISE_EN_SERVICE_A_REBOURS.mois - 1]} : ${qte(p.joursARebours)} jours d'utilisation, ${eur(p.dotationARebours)} de dotation. Une valeur nette dit combien de temps un équipement a servi, à condition de connaître sa base, sa durée et son mode : remonter le plan oblige à savoir ce que chaque chiffre compte.`,
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["depreciation"],
      tableau: (c) => tableauDesDeuxPlans(planDAmortissement(c)),
      texte: (c) => {
        const p = planDAmortissement(c);
        return [
          `Vous avez suivi l'équipement ${dE(c.entreprise)} sur toute sa vie : son coût d'acquisition, un plan linéaire de ${qte(p.derniereAnnee)} exercices, la dotation du 31 décembre, sa revente, et le plan dégressif qui avance les charges sans en changer le total.`,
          "Dans le compte de résultat, l'équipement coûte chaque année sa dotation ; au bilan, il vaut sa valeur nette comptable ; dans la banque, il n'a coûté qu'une fois, le jour de l'achat. À sa revente, le résultat de cession est le prix moins la valeur nette, et les dotations, moins le résultat de cession, font toujours le prix d'achat moins le prix de revente.",
          "Au niveau de l'examen, vous savez séparer le coût d'une immobilisation de ses charges, bâtir un plan linéaire ou dégressif complet avec ses prorata, chiffrer une cession, remonter d'une valeur nette à la date de mise en service, et dire ce que le dégressif change à l'impôt : un décalage, pas une économie.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Valeur brute au compte 2, usure cumulée au compte 28, dotation de l'année au 6811 : la valeur nette comptable, c'est la valeur brute moins les amortissements. Résultat de cession = prix de cession − valeur nette comptable au jour de la cession.",
    },
  ],
};
