import { eur, pct as enPoints } from "../../../pedagogy/cours/deux-decimales";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { JOURS_DE_LA_BANQUE, dateEcrite } from "../monde/comptes-de-la-boutique";
import {
  ARRETE,
  CONDITIONS_DE_LA_BANQUE,
  FACTURE_EN_DOUBLE,
  JOUR_DU_CHEQUE,
  PAS_DU_VIREMENT,
  RABAIS_DU_MERINOS,
  SOLDE_DU_20_JANVIER,
  VIREMENT_DU_COMITE,
  avoirDuMerinos,
  delaiMoyenFournisseurs,
  echeancier,
  echelleDInterets,
  facturesDeFevrier,
  fraisDeLArrete,
  jourDeValeur,
  operationsDeLaSemaine,
  pointageDuFaconnier,
  rapprochement,
  virementQuiEviteLeDecouvert,
} from "../monde/fournisseurs-et-banque-de-la-boutique";
import { MAILLE_ET_CO } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : FOURNISSEURS ET BANQUE, ÉCHÉANCIER, POINTAGE ET RAPPROCHEMENT (comptabilité générale, palier 4 ;
 * BTS CG P1, 1.5.3, 1.5.5, 1.6.1, 1.6.2 et 1.6.3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : MAILLE & CO en janvier et février N, ses trois façonniers et sa
 * banque (monde/maille-et-co.ts, monde/comptes-de-la-boutique.ts). Tous les chiffres se calculent dans
 * monde/fournisseurs-et-banque-de-la-boutique.ts.
 *
 * LE FIL : le délai moyen de crédit fournisseurs tiré du relevé annuel des achats, et ce qu'il cache ; le
 * pointage du compte du façonnier avec son relevé (une facture en double, un avoir non reçu) et les deux
 * corrections ; l'échéancier de février et mars, et l'ordre des règlements ; les moyens de règlement ; la
 * semaine de banque du 20 au 31 janvier, ses dates de valeur, son échelle d'intérêts et ses agios ;
 * l'état de rapprochement et ses trois écritures ; le compte rendu.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, le-delai-moyen, le-pointage, l-ecart-du-pointage, annuler-la-facture-en-double,
 *     l-avoir-non-recu (les comptes sont dans la question) ;
 *   · l'expérience avant la formule : predire-le-virement, puis le-laboratoire-du-decouvert (le virement
 *     d'épargne et son jour : l'échelle d'intérêts réagit, le graphique trace les intérêts) ;
 *   · autonome : l-echeancier, l-echelle-d-interets, les-agios, l-etat-de-rapprochement et ses écritures ;
 *   · expert : critique-du-delai, l-ordre-des-reglements, les-moyens-de-reglement, le-compte-rendu ; puis la
 *     synthèse.
 */

/** Les fournisseurs et la banque se jouent chez MAILLE & CO. */
export const ENTREPRISES_DES_FOURNISSEURS: readonly string[] = ["boutique"];

/** Les leviers du laboratoire : le virement d'épargne (€) et son jour. */
export const LEVIERS_DU_VIREMENT = { montant: { min: 0, max: 20_000, pas: PAS_DU_VIREMENT }, jour: { min: 20, max: 28, pas: 1 } } as const;
export const DEPART_DU_VIREMENT = { montant: 0, jour: 20 } as const;

const f = MAILLE_ET_CO;
const signe = (x: number) => (x < 0 ? eur(x) : `+ ${eur(x)}`);
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);
const jours = (n: number) => `${qte(n)} jour${n >= 2 ? "s" : ""}`;
const janvier = (j: number) => dateEcrite({ jour: j, mois: 1 });
const auJournal = (d: Parameters<typeof dateEcrite>[0]) => `${dateEcrite(d)} N`;

/** Tous les chiffres du chapitre. */
export function fournisseursEtBanque(_c: Pick<Cas, "code">) {
  const p = pointageDuFaconnier(f);
  return {
    entreprise: f.entreprise,
    delai: delaiMoyenFournisseurs(f),
    pointage: p,
    double: p.double,
    avoir: avoirDuMerinos(f),
    echeancier: echeancier(f),
    fevrier: facturesDeFevrier(f),
    ops: operationsDeLaSemaine(f),
    echelle: echelleDInterets(f),
    frais: fraisDeLArrete(f),
    r: rapprochement(f),
    virement: virementQuiEviteLeDecouvert(f),
  };
}

const position = (p: Readonly<Record<string, number>>) => ({ montant: p.montant ?? 0, jour: p.jour ?? DEPART_DU_VIREMENT.jour });

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

/** Les trois façonniers de la fiche. */
function lesFaconniers(): TableauDeDonnees {
  return {
    titre: "Les façonniers de la boutique",
    colonnes: ["Prix, face au référent", "Paiement"],
    lignes: f.fournisseurs.map((x) => ({ libelle: x.nom, valeurs: [pct(x.multiplicateur), x.delaiDePaiement === 0 ? "comptant" : `à ${jours(x.delaiDePaiement)} de la facture`] })),
  };
}

/** Le compte 401 du façonnier et son relevé, les pièces de janvier. */
function leCompteEtLeReleve(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = fournisseursEtBanque(c);
  return {
    titre: "Le compte 401 du façonnier et son relevé au 31 janvier : les pièces de janvier",
    colonnes: ["Compte 401", "Relevé du façonnier"],
    lignes: [
      ...x.pointage.lignes.map((l) => ({ libelle: l.libelle, valeurs: [l.ou === "faconnier" ? "" : eur(l.montant), l.ou === "boutique" ? "" : eur(l.montant)] })),
      { libelle: "Solde dû au façonnier", valeurs: [eur(x.pointage.chezLaBoutique), eur(x.pointage.chezLeFaconnier)] },
    ],
  };
}

/** La semaine de banque, au compte 512 et au relevé. */
function laSemaineDeBanque(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = fournisseursEtBanque(c);
  return {
    titre: `Du ${janvier(20)} au ${janvier(31)} : le compte 512 et le relevé, au jour de l'opération`,
    colonnes: ["Compte 512", "Relevé", "Valeur"],
    lignes: [
      { libelle: `Solde du ${janvier(20)}, pointé`, valeurs: [eur(SOLDE_DU_20_JANVIER), eur(SOLDE_DU_20_JANVIER), janvier(20)] },
      ...x.ops.map((o) => ({
        libelle: `${janvier(o.jour)} · ${o.libelle}`,
        valeurs: [o.ou === "releve" ? "" : signe(o.code === "salaires" ? -x.r.saisis : o.montant), o.ou === "compte" ? "" : signe(o.montant), o.ou === "compte" ? "" : janvier(jourDeValeur(o))],
      })),
      { libelle: `${janvier(31)} · Intérêts débiteurs, tenue de compte et TVA`, valeurs: ["", signe(-x.frais.total), janvier(31)] },
      { libelle: `Solde du ${janvier(31)}`, valeurs: [eur(x.r.compte), eur(x.r.releve), ""] },
    ],
  };
}

/** L'échéancier à compléter. */
function grilleDeLEcheancier(c: Pick<Cas, "code">): TableauACompleter {
  const x = fournisseursEtBanque(c);
  const e = x.echeancier;
  return {
    titre: "L'échéancier des fournisseurs au 15 février",
    colonnes: ["Février", "Mars"],
    lignes: [
      ...e.lignes.map((l) => ({
        libelle: `${l.libelle}, échéance le ${dateEcrite(l.echeance)}`,
        cellules: [2, 3].map((m) =>
          l.echeance.mois === m
            ? { valeur: l.montant, saisir: true, calcul: `${eur(l.montant)}, à régler le ${dateEcrite(l.echeance)}`, indice: "le montant de la pièce, dans le mois de son échéance ; un avoir vient en moins" }
            : { valeur: null },
        ),
      })),
      {
        libelle: "Total du mois",
        fort: true,
        totalDe: { plus: e.lignes.map((_, i) => i) },
        cellules: [
          { valeur: e.fevrier, saisir: true, calcul: `${eur(e.fevrier)}`, indice: "la somme des règlements de février" },
          { valeur: e.mars, saisir: true, calcul: `${eur(e.mars)}`, indice: "la somme des règlements de mars" },
        ],
      },
    ],
  };
}

/** L'échelle d'intérêts à compléter. */
function grilleDeLEchelle(c: Pick<Cas, "code">): TableauACompleter {
  const x = fournisseursEtBanque(c);
  const e = x.echelle;
  return {
    titre: `L'échelle d'intérêts du ${janvier(20)} au ${janvier(31)}, en valeur`,
    colonnes: ["Solde en valeur", "Jours", "Nombres débiteurs"],
    lignes: [
      ...e.periodes.map((p, i) => ({
        libelle: p.du === p.au ? `Le ${janvier(p.du)}` : `Du ${janvier(p.du)} au ${janvier(p.au)}`,
        cellules: [
          i === 0 ? { valeur: p.solde, texte: eur(p.solde) } : { valeur: p.solde, saisir: true, calcul: `le solde précédent et les opérations de valeur ${janvier(p.du)} : ${eur(p.solde)}`, indice: "le solde change à la date de valeur d'une opération, pas à sa date" },
          { valeur: p.jours, saisir: true, unite: "jours", calcul: `du ${janvier(p.du)} jusqu'à la date de valeur suivante : ${jours(p.jours)}`, indice: "les jours jusqu'au prochain changement de solde, le 31 en borne" },
          { valeur: p.nombresDebiteurs, saisir: true, nature: "grandeur" as const, calcul: p.solde < 0 ? `${eur(-p.solde)} × ${qte(p.jours)} = ${qte(p.nombresDebiteurs)}` : "un solde créditeur ne fait pas de nombres débiteurs : 0", indice: "solde débiteur × jours, rien pour un solde créditeur" },
        ],
      })),
      {
        libelle: "Total",
        fort: true,
        totalDe: { plus: e.periodes.map((_, i) => i) },
        cellules: [{ valeur: null }, { valeur: e.periodes.reduce((t, p) => t + p.jours, 0), unite: "jours", texte: jours(e.periodes.reduce((t, p) => t + p.jours, 0)) }, { valeur: e.nombres, saisir: true, nature: "grandeur" as const, calcul: `la somme des nombres débiteurs : ${qte(e.nombres)}`, indice: "la somme des nombres débiteurs" }],
      },
    ],
  };
}

/** L'état de rapprochement à compléter. */
function grilleDuRapprochement(c: Pick<Cas, "code">): TableauACompleter {
  const x = fournisseursEtBanque(c);
  const r = x.r;
  return {
    titre: `L'état de rapprochement au ${janvier(31)}`,
    colonnes: ["Compte 512", "Relevé"],
    lignes: [
      { libelle: `Solde du ${janvier(31)}`, cellules: [{ valeur: r.compte, texte: eur(r.compte) }, { valeur: r.releve, texte: eur(r.releve) }] },
      { libelle: "Virement du comité, avis non reçu", cellules: [{ valeur: VIREMENT_DU_COMITE, saisir: true, calcul: `+ ${eur(VIREMENT_DU_COMITE)} : la banque l'a reçu, le compte l'ignore`, indice: "ce que la banque a reçu et que le compte ne connaît pas" }, { valeur: null }] },
      { libelle: "Intérêts, tenue de compte et TVA", cellules: [{ valeur: -r.frais.total, saisir: true, calcul: `${eur(-r.frais.total)} : prélevés à l'arrêté, inconnus du compte`, indice: "ce que la banque a prélevé : en moins" }, { valeur: null }] },
      { libelle: "Salaires saisis avec deux chiffres inversés", cellules: [{ valeur: r.erreur, saisir: true, calcul: `${eur(r.saisis)} saisis pour ${eur(r.salaires)} payés : + ${eur(r.erreur)}`, indice: "l'écart entre le montant saisi et le montant payé, dans le bon sens" }, { valeur: null }] },
      { libelle: "Chèque de l'entretien, pas encore présenté", cellules: [{ valeur: null }, { valeur: -r.cheque, saisir: true, calcul: `${eur(-r.cheque)} : la banque le débitera à sa présentation`, indice: "ce que la boutique a payé et que la banque ne connaît pas encore : en moins" }] },
      {
        libelle: "Solde rectifié",
        fort: true,
        totalDe: { plus: [0, 1, 2, 3, 4] },
        cellules: [
          { valeur: r.compteRectifie, saisir: true, calcul: `${eur(r.compte)} + ${eur(VIREMENT_DU_COMITE)} − ${eur(r.frais.total)} + ${eur(r.erreur)} = ${eur(r.compteRectifie)}`, indice: "le solde et ses corrections" },
          { valeur: r.releveRectifie, saisir: true, calcul: `${eur(r.releve)} − ${eur(r.cheque)} = ${eur(r.releveRectifie)}`, indice: "le solde et sa correction" },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

export const FOURNISSEURS_ET_BANQUE: Chapitre = {
  code: "fournisseurs-et-banque",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P1 · Contrôle et traitement comptable des opérations commerciales"],
  titre: "Fournisseurs et banque : échéancier, pointage et rapprochement",
  accroche:
    "Le relevé du façonnier ne dit pas la même chose que le compte de la boutique, février a ses échéances, et la banque a prélevé des agios que personne n'attendait : vous pointez, vous ordonnez les règlements et vous rapprochez.",
  objectifs: [
    "Tenir l'échéancier des fournisseurs, ordonner les règlements et calculer le délai moyen de crédit fournisseurs",
    "Pointer le compte d'un fournisseur avec son relevé, expliquer les écarts et passer les corrections",
    "Lire un relevé bancaire : moyens de règlement, dates de valeur, échelle d'intérêts et agios",
    "Établir un état de rapprochement et enregistrer les régularisations",
  ],
  libre: false,
  prerequis: ["remises-et-reglements", "le-compte-client"],
  entreprises: {
    codes: ENTREPRISES_DES_FOURNISSEURS,
    pourquoi: "les fournisseurs et la banque se suivent ici chez MAILLE & CO, dans la simulation du cours, avec ses trois façonniers et sa banque ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois façonniers et une banque",
      notions: ["payment_terms", "cash_budget"],
      tableau: lesFaconniers,
      texte: (c) => {
        const x = fournisseursEtBanque(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.entreprise}, en janvier et février N. La boutique achète sa maille à trois façonniers, qui ne se paient pas au même rythme : le tableau les rappelle.`,
          `En janvier, le façonnier de référence a livré quatre fois, et facturé à chaque livraison. En février, la boutique essaie les deux autres : 100 bonnets à l'atelier local le 5, 300 écharpes en fins de série le 12, payées comptant.`,
          `Le comptable a trois contrôles à faire : le compte du façonnier face à son relevé, l'échéancier des règlements, et le compte en banque face au relevé de la banque.`,
        ];
      },
      repere: () => "Pointer, c'est retrouver chaque pièce des deux côtés. Ce qui n'est que d'un côté explique l'écart : une erreur à corriger, ou une opération que l'autre ne connaît pas encore.",
    },
    {
      id: "le-delai-moyen",
      objectifs: [0],
      type: "montants",
      titre: "Le délai moyen de crédit fournisseurs",
      notions: ["payment_terms"],
      question: (c) => {
        const x = fournisseursEtBanque(c);
        return `Le relevé annuel des achats de N − 1 donne ${eur(x.delai.achatsHt)} d'achats hors taxes, tous au façonnier de référence. Au 31 décembre, la boutique lui devait ${eur(x.delai.dettes)} toutes taxes comprises. Calculez les achats toutes taxes comprises, puis le délai moyen de crédit fournisseurs, au centième de jour, sur ${JOURS_DE_LA_BANQUE} jours.`;
      },
      champs: (c) => {
        const x = fournisseursEtBanque(c);
        const d = x.delai;
        return [
          { libelle: "Achats de N − 1, TTC", attendu: d.achatsTtc, calcul: `${eur(d.achatsHt)} × 1,2 = ${eur(d.achatsTtc)}` },
          { libelle: "Délai moyen, en jours", nature: "grandeur", attendu: d.delai, calcul: `${eur(d.dettes)} ÷ ${eur(d.achatsTtc)} × ${JOURS_DE_LA_BANQUE} = ${qte(d.delai)} jours`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = fournisseursEtBanque(c);
        return [`Le ratio dit ${qte(x.delai.delai)} jours, quand le façonnier accorde ${jours(x.delai.contractuel)}. Les dettes et les achats sont toutes taxes comprises tous les deux : sinon le ratio mélangerait deux bases.`];
      },
    },
    {
      id: "critique-du-delai",
      objectifs: [0],
      type: "choix",
      titre: "Pourquoi si court ?",
      notions: ["payment_terms"],
      question: (c) => {
        const x = fournisseursEtBanque(c);
        return `La boutique paie toujours le façonnier à ${jours(x.delai.contractuel)}, jamais avant. Comment expliquer un délai moyen de ${qte(x.delai.delai)} jours ?`;
      },
      options: (c) => {
        const x = fournisseursEtBanque(c);
        return [
          {
            texte: "Les achats de fin d'année sont plus faibles que la moyenne",
            juste: true,
            retour: `Oui. La dette du 31 décembre ne compte que les achats des 45 derniers jours : ${eur(x.delai.rythmeDeFinDAnnee)} par jour TTC, quand l'année en fait ${eur(x.delai.rythmeMoyen)} en moyenne. Les achats de Noël sont livrés en octobre et début novembre, et déjà payés. Un ratio de fin d'année dépend de la saison : l'échéancier, lui, dit le vrai délai.`,
          },
          {
            texte: "La boutique paie en réalité ses factures avant l'échéance convenue",
            juste: false,
            retour: "Non : l'énoncé dit le contraire, et l'échéancier le montre facture par facture. Le ratio ne mesure pas un comportement, il rapporte une dette à une date à des achats d'une année.",
          },
          {
            texte: "Les dettes sont toutes taxes comprises et les achats hors taxes",
            juste: false,
            retour: "Non : le calcul met les deux toutes taxes comprises. Mélanger les bases fausserait le ratio, mais ce n'est pas le cas ici.",
          },
        ];
      },
    },
    {
      id: "le-pointage",
      objectifs: [1],
      type: "tri",
      titre: "Pointer le compte du façonnier",
      notions: ["payment_terms"],
      tableau: leCompteEtLeReleve,
      question: () =>
        "Le façonnier envoie son relevé au 31 janvier : ce qu'il facture, ce qu'il rembourse. Ce qui est au crédit du compte 401 de la boutique est au débit de son compte client à lui. Rangez chaque pièce de janvier.",
      categories: [
        { code: "deux", libelle: "Des deux côtés" },
        { code: "boutique", libelle: "Au compte 401 seulement" },
        { code: "faconnier", libelle: "Au relevé seulement" },
      ],
      elements: (c) =>
        fournisseursEtBanque(c).pointage.lignes.map((l) => ({
          libelle: l.libelle,
          montant: l.montant,
          categorie: l.ou,
          pourquoi:
            l.ou === "deux"
              ? "La même facture, au même montant, chez l'un et chez l'autre : elle se pointe."
              : l.ou === "boutique"
                ? "Le façonnier ne l'a facturée qu'une fois : la boutique l'a saisie deux fois, reçue par courriel puis par courrier."
                : "Le façonnier a accordé un rabais pour le retard du mérinos ; l'avoir n'est pas arrivé à la boutique.",
        })),
      relance: "Pour chaque pièce, cherchez-la dans l'autre colonne : même date, même montant.",
      explication: () => ["Une facture et un avoir ne se pointent pas : la facture en double chez la boutique, l'avoir que seul le façonnier connaît. Les deux sont des erreurs de la boutique, à corriger chez elle."],
    },
    {
      id: "l-ecart-du-pointage",
      objectifs: [1],
      type: "montants",
      titre: "L'écart, expliqué",
      notions: ["payment_terms"],
      tableau: leCompteEtLeReleve,
      question: () => "Calculez ce que la boutique croit devoir au façonnier pour ses pièces de janvier, ce que le façonnier lui réclame, et l'écart. Il doit s'expliquer, au centime, par la facture en double et l'avoir.",
      champs: (c) => {
        const x = fournisseursEtBanque(c);
        const p = x.pointage;
        return [
          { libelle: "Dû selon le compte 401", attendu: p.chezLaBoutique, calcul: `les quatre factures et le doublon : ${eur(p.chezLaBoutique)}` },
          { libelle: "Dû selon le façonnier", attendu: p.chezLeFaconnier, calcul: `les quatre factures moins l'avoir : ${eur(p.chezLeFaconnier)}` },
          { libelle: "Écart", attendu: p.ecart, calcul: `${eur(p.chezLaBoutique)} − ${eur(p.chezLeFaconnier)} = ${eur(p.ecart)}, soit ${eur(p.double.ttc)} + ${eur(p.avoir.ttc)}` },
        ];
      },
      explication: (c) => {
        const x = fournisseursEtBanque(c);
        return [`Sans le pointage, l'échéancier aurait fait payer ${eur(x.double.ttc)} de trop le ${dateEcrite(x.double.echeance)}. Le comptable signale la facture en double et l'avoir à la gérance, demande le double de l'avoir au façonnier, et corrige.`];
      },
    },
    {
      id: "annuler-la-facture-en-double",
      objectifs: [1],
      type: "ecriture",
      titre: "Annuler la facture en double",
      notions: ["vat_payable"],
      evenement: (c) => {
        const x = fournisseursEtBanque(c);
        return `Le 31 janvier, le comptable annule la seconde saisie de la facture du ${dateEcrite(x.double.date)} : ${eur(x.double.ht)} de marchandises, ${eur(x.double.tva)} de TVA, ${eur(x.double.ttc)} au total. L'écriture inverse de la saisie en trop.`;
      },
      ecriture: (c) => {
        const x = fournisseursEtBanque(c);
        const d = x.double;
        return {
          date: auJournal({ jour: 31, mois: 1 }),
          libelle: `Annulation de la facture du façonnier saisie deux fois (${FACTURE_EN_DOUBLE.replace("F-", "")})`,
          lignes: [
            { role: "la dette en trop, qui disparaît", compte: "401", sens: "debit", montant: d.ttc, indice: "le montant toutes taxes comprises de la facture" },
            { role: "l'achat compté deux fois", compte: "607", sens: "credit", montant: d.ht, indice: "le hors taxes de la facture" },
            { role: "la TVA déduite deux fois", compte: "44566", sens: "credit", montant: d.tva, indice: "la TVA de la facture" },
          ],
        };
      },
      indices: () => ["La saisie avait crédité le fournisseur et débité l'achat et la TVA : faites l'inverse.", "Une TVA déduite deux fois ferait payer trop peu de TVA : elle se reprend aussi."],
      explication: () => ["Les achats et la TVA déductible du mois sont justes de nouveau. Une TVA déduite deux fois aurait été reprise au premier contrôle fiscal, avec des pénalités."],
    },
    {
      id: "l-avoir-non-recu",
      objectifs: [1],
      type: "ecriture",
      titre: "L'avoir non reçu",
      notions: ["vat_payable"],
      evenement: (c) => {
        const x = fournisseursEtBanque(c);
        return `Le double de l'avoir arrive : ${pct(RABAIS_DU_MERINOS.taux)} de rabais sur la facture du mérinos, ${eur(x.avoir.ht)} hors taxes, ${eur(x.avoir.tva)} de TVA, ${eur(x.avoir.ttc)} au total, daté du ${dateEcrite(x.avoir.date)}. Passez l'avoir reçu.`;
      },
      ecriture: (c) => {
        const x = fournisseursEtBanque(c);
        const a = x.avoir;
        return {
          date: auJournal(a.date),
          libelle: "Avoir du façonnier, rabais sur le mérinos",
          lignes: [
            { role: "la dette envers le façonnier, qui baisse", compte: "401", sens: "debit", montant: a.ttc, indice: "le total de l'avoir" },
            { role: "le rabais obtenu", compte: "6097", acceptes: ["609"], sens: "credit", montant: a.ht, indice: "le hors taxes de l'avoir" },
            { role: "la TVA déductible, qui baisse avec le prix", compte: "44566", sens: "credit", montant: a.tva, indice: "la TVA de l'avoir" },
          ],
        };
      },
      indices: () => ["Un avoir est une facture à l'envers : la dette baisse, l'achat et la TVA aussi.", "Le rabais obtenu sur des marchandises a son compte, qui vient en moins des achats."],
      explication: (c) => {
        const x = fournisseursEtBanque(c);
        return [`Le compte 401 porte ${eur(x.pointage.chezLeFaconnier)} pour les pièces de janvier, comme le relevé du façonnier : les deux se pointent ligne à ligne.`];
      },
    },
    {
      id: "l-echeancier",
      objectifs: [0],
      type: "a-completer",
      titre: "L'échéancier de février et mars",
      notions: ["payment_terms", "cash_budget"],
      question: (c) => {
        const x = fournisseursEtBanque(c);
        const s = x.fevrier.find((y) => y.fournisseur === "fins-de-serie")!;
        return `Le 15 février, le compte du façonnier est corrigé. Placez chaque pièce non réglée dans le mois de son échéance, l'avoir en moins, puis faites le total de chaque mois. Les fins de série, ${eur(s.ttc)}, ont été payées comptant le ${dateEcrite(s.date)} : elles n'y sont plus.`;
      },
      grille: grilleDeLEcheancier,
      explication: (c) => {
        const x = fournisseursEtBanque(c);
        return [`Février demande ${eur(x.echeancier.fevrier)}, mars ${eur(x.echeancier.mars)}. L'échéancier dit à la trésorerie ce qui sortira, et quand : c'est lui que le budget de trésorerie reprend.`];
      },
    },
    {
      id: "l-ordre-des-reglements",
      objectifs: [0],
      type: "choix",
      titre: "L'ordre des règlements",
      notions: ["payment_terms", "cash_budget"],
      question: () => "Comment la boutique règle-t-elle les factures du façonnier en février ?",
      options: (c) => {
        const x = fournisseursEtBanque(c);
        const dates = x.echeancier.lignes.filter((l) => l.echeance.mois === 2).map((l) => dateEcrite(l.echeance));
        return [
          {
            texte: "Un virement à chaque échéance de février",
            juste: true,
            retour: `Oui : le ${dates.join(", le ")}. Sans escompte offert, payer avant l'échéance ne rapporte rien et prive la trésorerie de quelques jours ; payer après ouvre des pénalités de retard et abîme la relation. Le comptable prépare chaque virement, la gérance le valide.`,
          },
          {
            texte: "Tout le 15 février, en un seul virement, pour ne plus y penser",
            juste: false,
            retour: "Non : la boutique avancerait l'argent d'une à deux semaines sans rien gagner. Un regroupement se fait à l'échéance, pas avant.",
          },
          {
            texte: "Tout le 1er mars, avec la facture du mérinos, pour regrouper les virements",
            juste: false,
            retour: "Non : trois factures seraient payées en retard. Les pénalités sont dues de plein droit, avec l'indemnité de 40 € par facture.",
          },
        ];
      },
    },
    {
      id: "les-moyens-de-reglement",
      objectifs: [2],
      type: "tri",
      titre: "Les moyens de règlement",
      notions: ["payment_terms"],
      question: () => "Chaque moyen de règlement passe en banque à un moment différent. Rangez-les : la banque débite-t-elle la boutique le jour où celle-ci le décide, ou le jour où un autre le présente ?",
      categories: [
        { code: "boutique", libelle: "Le jour que la boutique décide" },
        { code: "autre", libelle: "Quand un autre le présente" },
      ],
      elements: (c) => {
        const x = fournisseursEtBanque(c);
        return [
          { libelle: "Le virement SEPA au façonnier", montant: x.echeancier.lignes[0]!.montant, categorie: "boutique", pourquoi: "La boutique l'ordonne pour une date : la banque l'exécute ce jour-là." },
          { libelle: "Le prélèvement de la TVA par l'administration", montant: -x.ops.find((o) => o.code === "tva")!.montant, categorie: "autre", pourquoi: "Le créancier présente le prélèvement, en vertu d'un mandat ou de la loi : la boutique ne choisit pas le jour." },
          { libelle: "Le chèque à l'entreprise d'entretien", montant: x.r.cheque, categorie: "autre", pourquoi: "Le bénéficiaire le remet à sa banque quand il veut : c'est le moyen qui fait le plus d'écarts au rapprochement." },
          { libelle: "Le virement des salaires", montant: x.r.salaires, categorie: "boutique", pourquoi: "La boutique l'ordonne, le jour de la paie." },
          { libelle: "Une LCR que l'atelier local tirerait sur la boutique", montant: x.fevrier.find((y) => y.fournisseur === "atelier-local")!.ttc, categorie: "autre", pourquoi: "Le fournisseur la présente à l'échéance ; la boutique peut seulement la refuser." },
        ];
      },
      relance: "Demandez-vous qui envoie l'ordre à la banque : la boutique, ou celui qu'elle paie.",
      explication: () => ["Ce que la boutique ordonne, elle sait quand ça passe. Ce qu'un autre présente, chèque, prélèvement ou effet, peut passer plus tard que prévu : c'est ce que le rapprochement surveille."],
    },
    {
      id: "l-echelle-d-interets",
      objectifs: [2],
      type: "a-completer",
      titre: "Les dates de valeur et l'échelle d'intérêts",
      notions: ["net_treasury"],
      tableau: laSemaineDeBanque,
      question: () =>
        `La banque compte les intérêts sur le solde en valeur. Un crédit porte valeur le lendemain, un débit le jour même. Rangez les opérations du relevé par date de valeur, suivez le solde, comptez les jours où il tient, puis les nombres débiteurs : solde débiteur × jours. Le 31, l'arrêté, sert de borne.`,
      grille: grilleDeLEchelle,
      explication: (c) => {
        const x = fournisseursEtBanque(c);
        return [
          `La TVA du ${janvier(21)} part avant que les cartes du ${janvier(23)} ne portent valeur, le lendemain : ${jours(x.echelle.joursDebiteurs)} de découvert en valeur, jusqu'à ${eur(x.echelle.plusFortDecouvert)}. Un crédit qui porte valeur le lendemain allonge chaque découvert d'un jour : c'est la date de valeur qui coûte.`,
        ];
      },
    },
    {
      id: "les-agios",
      objectifs: [2],
      type: "montants",
      titre: "Les agios de l'arrêté",
      notions: ["net_treasury"],
      question: (c) => {
        const x = fournisseursEtBanque(c);
        return `Calculez les intérêts débiteurs à ${pct(CONDITIONS_DE_LA_BANQUE.tauxDuDecouvert)} sur ${JOURS_DE_LA_BANQUE} jours, puis la TVA de la tenue de compte, ${eur(CONDITIONS_DE_LA_BANQUE.tenueDeCompteHt)} hors taxes, et le total que la banque prélève le ${janvier(31)}. Les nombres débiteurs font ${qte(x.echelle.nombres)}.`;
      },
      champs: (c) => {
        const x = fournisseursEtBanque(c);
        const fr = x.frais;
        return [
          { libelle: "Intérêts débiteurs", attendu: fr.interets, calcul: `${qte(x.echelle.nombres)} × ${pct(CONDITIONS_DE_LA_BANQUE.tauxDuDecouvert)} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(fr.interets)}` },
          { libelle: "TVA sur la tenue de compte", attendu: fr.tva, calcul: `${eur(fr.tenueDeCompte)} × ${pct(CONDITIONS_DE_LA_BANQUE.tvaDesFrais)} = ${eur(fr.tva)}` },
          { libelle: "Total prélevé", attendu: fr.total, calcul: `${eur(fr.interets)} + ${eur(fr.tenueDeCompte)} + ${eur(fr.tva)} = ${eur(fr.total)}` },
        ];
      },
      explication: () => ["Les intérêts sont exonérés de TVA : ils rémunèrent un crédit. La tenue de compte est un service, avec sa TVA, que la boutique déduit. Les deux sont au relevé et pas encore au compte."],
    },
    {
      id: "predire-le-virement",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur un virement d'épargne",
      notions: ["net_treasury", "cash_budget"],
      question: (c) => {
        const x = fournisseursEtBanque(c);
        return `Avant le laboratoire, pariez. La boutique a de l'argent sur son compte d'épargne, disponible le jour même. Pour ne jamais être débitrice en valeur, combien doit-elle virer au compte courant, et quand ? Le plus gros solde débiteur en valeur est de ${eur(x.echelle.plusFortDecouvert)}.`;
      },
      options: () => {
        const voir = "Faites-le au laboratoire, à l'étape suivante.";
        return [
          { texte: "Ce montant, le jour du premier débit", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Le total des débits de la semaine, dès le 20", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Ce montant, le jour de la remise des cartes", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-decouvert",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire du découvert",
      notions: ["net_treasury", "cash_budget"],
      question: () =>
        "Faites varier le virement du compte d'épargne au compte courant, par 1 000 €, et son jour, valeur le jour même. Le tableau suit l'échelle d'intérêts : les jours débiteurs, le plus fort découvert en valeur, les nombres et les intérêts ; le graphique trace les intérêts selon le virement. Relevez le défi.",
      leviers: () => [
        { code: "montant", libelle: "Virement d'épargne", unite: "€", ...LEVIERS_DU_VIREMENT.montant, depart: DEPART_DU_VIREMENT.montant },
        { code: "jour", libelle: "Jour du virement", unite: "janvier", ...LEVIERS_DU_VIREMENT.jour, depart: DEPART_DU_VIREMENT.jour },
      ],
      lecture: (_c, p) => {
        const q = position(p);
        const x = echelleDInterets(f, q);
        const d = echelleDInterets(f, DEPART_DU_VIREMENT);
        return [
          { libelle: "Jours débiteurs en valeur", montant: x.joursDebiteurs, unite: "jours", reference: d.joursDebiteurs },
          { libelle: "Plus fort découvert en valeur", montant: x.plusFortDecouvert, reference: d.plusFortDecouvert },
          { libelle: "Nombres débiteurs", montant: x.nombres, unite: "nombres", reference: d.nombres },
          { libelle: "Intérêts débiteurs", montant: x.interets, reference: d.interets, fort: true },
        ];
      },
      graphique: () => ({
        levier: "montant",
        courbes: [{ libelle: "Intérêts débiteurs", valeur: (p) => echelleDInterets(f, position(p)).interets }],
      }),
      defi: (c) => {
        const x = fournisseursEtBanque(c);
        return {
          consigne: "Trouvez le plus petit virement, et le jour le plus tardif, qui ne laissent aucun jour débiteur en valeur : l'épargne travaille le plus longtemps possible.",
          atteint: (p) => {
            const q = position(p);
            return echelleDInterets(f, q).joursDebiteurs === 0 && q.montant <= x.virement.montant && q.jour >= x.virement.jour;
          },
          indice: (p) => {
            const q = position(p);
            const e = echelleDInterets(f, q);
            if (e.joursDebiteurs > 0) return `Il reste ${jours(e.joursDebiteurs)} débiteurs, jusqu'à ${eur(e.plusFortDecouvert)} : virez plus, ou plus tôt.`;
            if (q.montant > x.virement.montant) return "Aucun jour débiteur : essayez de virer moins.";
            return "Aucun jour débiteur : essayez de virer plus tard.";
          },
          solution: { montant: x.virement.montant, jour: x.virement.jour },
        };
      },
      explication: (c) => {
        const x = fournisseursEtBanque(c);
        return [
          `Défi relevé : ${eur(x.virement.montant)} le ${janvier(x.virement.jour)}, le jour où la TVA part. Un jour plus tard, le prélèvement passe sur un compte vide ; un euro de moins, et le compte est débiteur du ${janvier(21)} au ${janvier(23)}.`,
          `Les intérêts évités, ${eur(x.echelle.interets)}, sont petits ; mais une banque juge aussi une entreprise sur ses jours de découvert. L'échéancier des sorties sert à cela : prévoir le virement avant le débit.`,
        ];
      },
    },
    {
      id: "l-etat-de-rapprochement",
      objectifs: [3],
      type: "a-completer",
      titre: "L'état de rapprochement",
      notions: ["net_treasury"],
      tableau: laSemaineDeBanque,
      question: (c) => {
        const x = fournisseursEtBanque(c);
        return `Au ${janvier(31)}, le compte 512 porte ${eur(x.r.compte)} et le relevé ${eur(x.r.releve)}. Pointez les deux, puis complétez l'état de rapprochement : chaque côté se corrige de ce qu'il ignore ou de ce qu'il a mal saisi. Le chèque du ${janvier(JOUR_DU_CHEQUE)} n'est pas encore présenté. Les deux soldes rectifiés doivent être égaux.`;
      },
      grille: grilleDuRapprochement,
      explication: (c) => {
        const x = fournisseursEtBanque(c);
        return [
          `Les deux côtés tombent sur ${eur(x.r.compteRectifie)}. Le chèque ne se corrige pas au compte : il est juste, la banque le débitera à sa présentation. Ce qui se corrige au compte s'écrit au journal : le virement, les frais et l'erreur.`,
        ];
      },
    },
    {
      id: "le-virement-du-comite",
      objectifs: [3],
      type: "ecriture",
      titre: "Le virement du comité",
      notions: ["payment_terms"],
      evenement: () => `Le relevé montre le virement d'un comité d'entreprise, ${eur(VIREMENT_DU_COMITE)}, pour sa commande de Noël facturée en décembre. Passez-le, daté du relevé.`,
      ecriture: () => ({
        date: auJournal({ jour: 30, mois: 1 }),
        libelle: "Virement d'un comité d'entreprise, commande de Noël",
        lignes: [
          { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: VIREMENT_DU_COMITE, indice: "le montant du virement" },
          { role: "la créance sur le comité, qui s'éteint", compte: "411", sens: "credit", montant: VIREMENT_DU_COMITE, indice: "le même montant" },
        ],
      }),
      indices: () => ["La banque a reçu.", "Le comité ne doit plus sa commande de Noël."],
      explication: () => ["Le compte du comité se lettre avec sa facture de décembre. Une relance prévue pour la semaine suivante aurait été une maladresse : pointer avant de relancer."],
    },
    {
      id: "les-frais-de-l-arrete",
      objectifs: [3],
      type: "ecriture",
      titre: "Les agios et les frais",
      notions: ["net_treasury", "vat_payable"],
      evenement: (c) => {
        const x = fournisseursEtBanque(c);
        return `Passez ce que la banque a prélevé le ${janvier(31)} : ${eur(x.frais.interets)} d'intérêts débiteurs, ${eur(x.frais.tenueDeCompte)} de tenue de compte et ${eur(x.frais.tva)} de TVA.`;
      },
      ecriture: (c) => {
        const x = fournisseursEtBanque(c);
        const fr = x.frais;
        return {
          date: auJournal(ARRETE),
          libelle: "Agios et frais de l'arrêté de janvier",
          lignes: [
            { role: "les intérêts du découvert", compte: "6616", acceptes: ["661"], sens: "debit", montant: fr.interets, indice: "les intérêts débiteurs du relevé" },
            { role: "la tenue de compte, un service bancaire", compte: "627", sens: "debit", montant: fr.tenueDeCompte, indice: "les frais hors taxes" },
            { role: "la TVA déductible sur les frais", compte: "44566", sens: "debit", montant: fr.tva, indice: "la TVA des frais" },
            { role: "la banque, débitée", compte: "512", sens: "credit", montant: fr.total, indice: "le total prélevé" },
          ],
        };
      },
      indices: () => ["Les intérêts d'un découvert sont une charge financière.", "Les frais de tenue de compte sont un service bancaire, avec de la TVA déductible."],
      explication: () => ["Deux charges de nature différente : le prix de l'argent emprunté quelques jours, et le prix d'un service. La première est financière, la seconde d'exploitation."],
    },
    {
      id: "l-erreur-de-saisie",
      objectifs: [3],
      type: "ecriture",
      titre: "L'erreur de saisie",
      notions: ["net_treasury"],
      evenement: (c) => {
        const x = fournisseursEtBanque(c);
        return `Le virement des salaires nets, ${eur(x.r.salaires)}, a été saisi pour ${eur(x.r.saisis)} : deux chiffres inversés. La paie a crédité le compte 421 des salaires dus ; le virement l'a débité de trop. Corrigez de ${eur(x.r.erreur)}.`;
      },
      ecriture: (c) => {
        const x = fournisseursEtBanque(c);
        return {
          date: auJournal(ARRETE),
          libelle: "Correction du virement des salaires de janvier",
          lignes: [
            { role: "la banque, sortie de trop à la saisie", compte: "512", sens: "debit", montant: x.r.erreur, indice: "l'écart entre le saisi et le payé" },
            { role: "les salaires dus, débités de trop", compte: "421", sens: "credit", montant: x.r.erreur, indice: "le même écart" },
          ],
        };
      },
      indices: () => ["La saisie a fait sortir de la banque plus que le relevé : rendez la différence au compte 512.", "La contrepartie est le compte que le virement soldait, les salaires dus."],
      explication: () => ["Une inversion de deux chiffres laisse toujours un écart divisible par 9 : c'est un indice que le comptable connaît. Le compte 512 et le relevé sont rapprochés, le compte 421 est soldé."],
    },
    {
      id: "le-compte-rendu",
      objectifs: [3, 1],
      type: "choix",
      titre: "Le compte rendu à la gérance",
      notions: ["net_treasury", "payment_terms"],
      question: () => "Que met le comptable dans son compte rendu à la gérance ?",
      options: (c) => {
        const x = fournisseursEtBanque(c);
        return [
          {
            texte: "Les écarts, leur cause, ce qui est corrigé et ce qui reste à surveiller",
            juste: true,
            retour: `Oui. Le doublon de ${eur(x.double.ttc)} et l'avoir de ${eur(x.avoir.ttc)} sont corrigés. Février demande ${eur(x.echeancier.fevrier)}. Les agios, ${eur(x.frais.interets)}, viennent de la TVA partie avant les cartes. Le chèque du ${janvier(JOUR_DU_CHEQUE)} est à suivre. Et une proposition : virer de l'épargne avant les gros prélèvements.`,
          },
          {
            texte: "L'état de rapprochement seul : les soldes rectifiés sont égaux, c'est la preuve",
            juste: false,
            retour: "Non : des soldes égaux prouvent que les écarts sont expliqués, pas qu'ils sont réglés. La gérance doit savoir ce qui a été corrigé, et ce qui reste à suivre.",
          },
          {
            texte: "Rien : des agios de quelques euros ne valent pas un compte rendu",
            juste: false,
            retour: "Non : le montant est petit, la cause ne l'est pas. Une facture en double payée deux fois, elle, aurait coûté des milliers d'euros.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["payment_terms", "net_treasury", "cash_budget"],
      texte: (c) => {
        const x = fournisseursEtBanque(c);
        return [
          `Le pointage du façonnier a trouvé ${eur(x.pointage.ecart)} d'écart, une facture en double et un avoir non reçu, corrigés au journal. L'échéancier dit ${eur(x.echeancier.fevrier)} à régler en février, à chaque échéance. Le délai moyen de ${qte(x.delai.delai)} jours tiré du bilan sous-estime les 45 jours réels : la fin d'année achète peu.`,
          `À la banque, les dates de valeur ont fait ${jours(x.echelle.joursDebiteurs)} de découvert et ${eur(x.frais.interets)} d'intérêts. L'état de rapprochement tombe juste à ${eur(x.r.compteRectifie)}, après trois écritures : le virement reçu, les frais, l'erreur ; le chèque non présenté attend sa présentation.`,
          "Au niveau de l'examen, vous savez tenir un échéancier, pointer un compte fournisseur, lire un relevé en valeur, calculer des agios par l'échelle d'intérêts, établir un état de rapprochement et passer ses régularisations.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : les calculs, eux, sont les mêmes.",
        ];
      },
      repere: () =>
        "Délai fournisseurs = dettes TTC ÷ achats TTC × 360. Nombres débiteurs = solde débiteur en valeur × jours ; intérêts = nombres × taux ÷ 360. Au rapprochement, on corrige au compte ce que la banque connaît seule (et ses erreurs), au relevé ce que la boutique connaît seule.",
    },
  ],
};
