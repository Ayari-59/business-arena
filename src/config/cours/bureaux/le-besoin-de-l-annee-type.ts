import { eur, nombreAuCentieme, pct as enPoints } from "../../../pedagogy/cours/deux-decimales";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { auCentime } from "../monde/amortissement";
import {
  ANNEE_TYPE,
  DELAI_DES_COTISATIONS,
  DELAI_DES_SALAIRES_NETS,
  DELAI_DE_LA_TVA,
  JOUR_DE_PAIEMENT_DE_LA_TVA,
  STOCK_EN_JOURS_DE_CONSOMMATION,
  besoinAuBilan,
  bfrNormatif,
  type PosteNormatif,
} from "../monde/bfr-normatif";
import { dateEcrite as dateDuCompte } from "../monde/compte-client-de-nova";
import { empruntALaCloture } from "../monde/emprunt";
import { CAMPUSTECH, CONTRAT_DE_PRET, ELECTRO_COMPOSANTS, EXERCICE_DE_NOVA, PAIE_DU_MOIS, SONORA } from "../monde/exercice-de-nova";
import { AUTRES_COUTS_PAR_ENCEINTE, COMPOSANTS_PAR_ENCEINTE, DELAI_CONVENU_DE_CAMPUSTECH, JOURS_DU_MOIS_COMMERCIAL, PRIX_DE_L_ENCEINTE, TAUX_DE_TVA } from "../monde/nova-gestion";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LE BESOIN DE L'ANNÉE TYPE (comptabilité générale, palier 4 ; DCG UE6 2.2).
 *
 * La suite du chapitre « Le BFR d'exploitation normatif », au bureau : début janvier N+1, la banque de
 * NOVA demande son besoin en fonds de roulement normatif pour fixer son découvert. Le chapitre donnait
 * les délais ; ici, l'élève les relève sur les pièces (le contrat et le compte de CampusTech, la facture
 * d'Électro-Composants, la note de stock, l'avis de TVA, la paie), écarte ce qui n'est pas du cycle
 * d'exploitation ou ne se répète pas (la créance de Sonora, l'emprunt), dresse le tableau normatif, puis
 * la part fixe et le besoin en euros, et répond au président. Le piège : le délai convenu de CampusTech,
 * que le contrat donne, n'est pas celui qu'elle tient.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS (monde/bfr-normatif.ts, `bfrNormatif`, et la fiche
 * de l'exercice) ; ce fichier écrit la pile, les consignes et les corrigés, qui ne partent jamais au
 * navigateur. Aucune hypothèse nouvelle sur NOVA.
 *
 * POURQUOI UN BUREAU : le besoin normatif se construit à partir de pièces et de délais qu'il faut relever,
 * trier et saisir dans un tableau ; c'est un travail de dossier, sans arbitrage.
 */

/** Un jour du cours, écrit : « 6 janvier ». */
const dateEcrite = (d: { jour: number; mois: number }) => dateDuCompte({ jour: d.jour, mois: d.mois });
/** Un nombre au centième (deux décimales s'il n'est pas entier), ou à `d` chiffres quand on les demande. */
const qte = (n: number, d = 2) => (d === 2 ? nombreAuCentieme(n) : (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−"));
const coef = (n: number) => (n + 0).toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const jours = (n: number) => `${qte(n)} jour${Math.abs(n) >= 2 ? "s" : ""}`;
/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);

const x = bfrNormatif();
const BILAN = besoinAuBilan();
const AU_DELAI_CONVENU = bfrNormatif({ campustech: DELAI_CONVENU_DE_CAMPUSTECH });
const f = EXERCICE_DE_NOVA;
const SONORA_IMPAYEE = f.creances.find((c) => c.litigieuse)!;
const EMPRUNT = empruntALaCloture(CONTRAT_DE_PRET);

const JOUR = "5 janvier N+1";
const MOIS = ["juillet", "août", "septembre"] as const;
const RANG_DES_MOIS = { juillet: 7, août: 8, septembre: 9 } as const;
const NOMS_DES_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;

/** Une facture de CampusTech de l'exercice, le 20 du mois, et son règlement, au délai qu'elle tient (mois de 30 jours). */
function factureEtReglement(mois: (typeof MOIS)[number]) {
  const rang = (RANG_DES_MOIS[mois] - 1) * JOURS_DU_MOIS_COMMERCIAL + CAMPUSTECH.jourDeFacturation + CAMPUSTECH.delai;
  const moisDuReglement = Math.floor((rang - 1) / JOURS_DU_MOIS_COMMERCIAL) + 1;
  const jour = rang - (moisDuReglement - 1) * JOURS_DU_MOIS_COMMERCIAL;
  return { facture: `${CAMPUSTECH.jourDeFacturation} ${mois}`, reglement: `${jour === 1 ? "1er" : jour} ${NOMS_DES_MOIS[moisDuReglement - 1]}` };
}

const FACTURE_MENSUELLE = auCentime(CAMPUSTECH.enceintesParFacture * PRIX_DE_L_ENCEINTE * (1 + TAUX_DE_TVA));

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "Le besoin normatif, pour la banque",
  paragraphes: [
    "Bonjour,",
    `La banque veut notre besoin en fonds de roulement normatif pour fixer notre découvert de N+1. Le bilan du 31 décembre dit ${eur(BILAN)}, mais elle veut un besoin de régime de croisière.`,
    "Reprenez nos délais sur les pièces, faites le calcul poste par poste, et dites-moi ce que j'annonce.",
    "Merci. Le président",
  ],
};

const CONTRAT: PieceDuBureau = {
  code: "contrat",
  nature: "lettre",
  titre: "Le contrat de CampusTech",
  de: "CampusTech",
  a: "NOVA",
  date: "N",
  objet: "Conditions d'achat des enceintes",
  paragraphes: [
    `${CAMPUSTECH.enceintesParFacture} enceintes par mois, à ${eur(PRIX_DE_L_ENCEINTE)} hors taxes, facturées le ${CAMPUSTECH.jourDeFacturation} de chaque mois.`,
    `Paiement par virement à ${jours(DELAI_CONVENU_DE_CAMPUSTECH)} de la date de facture.`,
  ],
};

const COMPTE_DE_CAMPUSTECH: PieceDuBureau = {
  code: "compte-campustech",
  nature: "extrait",
  titre: "Le compte de CampusTech, l'été N",
  de: "La comptabilité clients",
  a: "Le service comptable",
  date: "31 décembre N",
  lignes: MOIS.flatMap((m) => {
    const r = factureEtReglement(m);
    return [
      { date: r.facture, libelle: `Facture de ${m}`, montant: FACTURE_MENSUELLE },
      { date: r.reglement, libelle: `Virement de CampusTech, facture de ${m}`, montant: -FACTURE_MENSUELLE },
    ];
  }),
  mention: "Les factures de l'automne suivent le même rythme.",
};

const FACTURE_D_ELECTRO: PieceDuBureau = {
  code: "electro",
  nature: "facture",
  titre: "Facture d'Électro-Composants",
  de: ELECTRO_COMPOSANTS.nom,
  a: "NOVA",
  date: `${ELECTRO_COMPOSANTS.jourDeFacturation} novembre N`,
  objet: "Les composants du mois",
  paragraphes: [`Livrés et facturés le ${ELECTRO_COMPOSANTS.jourDeFacturation} de chaque mois, à ${eur(ELECTRO_COMPOSANTS.prixDuJeu)} hors taxes le jeu. Paiement à ${jours(ELECTRO_COMPOSANTS.delai)} de la date de facture.`],
};

const STOCK: PieceDuBureau = {
  code: "stock",
  nature: "note",
  titre: "Note de l'atelier sur le stock",
  de: "L'atelier de NOVA",
  a: "Le service comptable",
  date: JOUR,
  paragraphes: [
    `Les composants arrivent le ${ELECTRO_COMPOSANTS.jourDeFacturation} pour tout le mois. La ligne les consomme au même rythme chaque jour, et le stock retombe à zéro à la livraison suivante.`,
    `Un jeu par enceinte. Les autres coûts de l'enceinte, emballage, transport et énergie, ${eur(AUTRES_COUTS_PAR_ENCEINTE)}, se paient dans le mois.`,
  ],
};

const TVA: PieceDuBureau = {
  code: "tva",
  nature: "avis",
  titre: "Avis de paiement de la TVA",
  de: "Le service des impôts des entreprises",
  a: "NOVA",
  date: `${JOUR_DE_PAIEMENT_DE_LA_TVA} décembre N`,
  objet: "Déclaration de novembre N",
  paragraphes: [`La TVA d'un mois se déclare et se paie le ${JOUR_DE_PAIEMENT_DE_LA_TVA} du mois suivant : la TVA collectée sur les ventes du mois, moins la TVA déductible sur ses achats.`],
};

const PAIE: PieceDuBureau = {
  code: "paie",
  nature: "note",
  titre: "Le récapitulatif de la paie du mois",
  de: "Le service de la paie",
  a: "Le service comptable",
  date: "décembre N",
  paragraphes: [
    `${PAIE_DU_MOIS.effectif} salariés, la même paie chaque mois, quelles que soient les ventes. Le net est viré le ${PAIE_DU_MOIS.jourDuVirement} du mois ; les cotisations et le prélèvement à la source se versent le ${PAIE_DU_MOIS.jourDesCotisations} du mois suivant.`,
  ],
  montants: [
    { libelle: "Net à payer du mois", montant: x.paie.netAPayer },
    { libelle: "Cotisations et prélèvement à la source du mois", montant: x.paie.aVerser, fort: true },
  ],
};

const SONORA_EN_REDRESSEMENT: PieceDuBureau = {
  code: "sonora",
  nature: "lettre",
  titre: "Lettre du mandataire de Sonora",
  de: "Le mandataire judiciaire de Sonora",
  a: "NOVA",
  date: "décembre N",
  objet: "Redressement judiciaire de Sonora",
  paragraphes: [`Le tribunal a ouvert un redressement judiciaire le ${dateEcrite(SONORA.redressement.date)} N. Déclarez votre créance : la facture du ${dateEcrite(SONORA_IMPAYEE.date)} N, échue le ${dateEcrite(SONORA_IMPAYEE.echeance)} et impayée.`],
  montants: [{ libelle: "Créance de NOVA, toutes taxes comprises", montant: SONORA_IMPAYEE.ttc, fort: true }],
};

const EMPRUNT_DE_NOVA: PieceDuBureau = {
  code: "emprunt",
  nature: "note",
  titre: "L'échéancier de l'emprunt",
  de: "La banque de NOVA",
  a: "NOVA",
  date: "31 décembre N",
  paragraphes: [`Emprunt de ${eur(CONTRAT_DE_PRET.capital)} à ${pct(CONTRAT_DE_PRET.tauxAnnuel)} sur ${CONTRAT_DE_PRET.dureeAns} ans, ${CONTRAT_DE_PRET.echeancesParAn} échéances par an, capital et intérêts.`],
  montants: [{ libelle: "Capital restant dû au 31 décembre N", montant: EMPRUNT.capitalRestantDu, fort: true }],
};

const ANNEE: PieceDuBureau = {
  code: "annee-type",
  nature: "note",
  titre: "Les flux de l'année type",
  de: "Le contrôle de gestion de NOVA",
  a: "Le service comptable",
  date: JOUR,
  paragraphes: [
    `L'année qui se répète : ${qte(ANNEE_TYPE.particuliers, 0)} enceintes aux particuliers, payées à la commande, et ${qte(ANNEE_TYPE.campustech, 0)} à CampusTech. Les opérations qui ne reviendront pas en sont exclues.`,
    `Prix de l'enceinte : ${eur(PRIX_DE_L_ENCEINTE)} hors taxes ; jeu de composants : ${eur(COMPOSANTS_PAR_ENCEINTE)} ; TVA à ${pct(TAUX_DE_TVA)}.`,
  ],
  montants: [
    { libelle: "Chiffre d'affaires hors taxes", montant: x.caHt, fort: true },
    { libelle: "Ventes TTC à CampusTech", montant: x.campustechTtc },
    { libelle: "Ventes TTC aux particuliers", montant: x.particuliersTtc },
    { libelle: "Consommation de composants HT", montant: x.consommation },
    { libelle: "Achats de composants TTC", montant: x.achatsTtc },
    { libelle: "TVA déductible, composants et autres coûts", montant: x.tvaDeductible },
    { libelle: "TVA collectée", montant: x.tvaCollectee },
  ],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, ANNEE, CONTRAT, COMPTE_DE_CAMPUSTECH, FACTURE_D_ELECTRO, STOCK, TVA, PAIE, SONORA_EN_REDRESSEMENT];
// L'échéancier de l'emprunt reste hors de la pile : neuf pièces au plus. Il entre dans le tri par son libellé.

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

const enJours = { unite: "jours" };
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });
const vide: CelluleACompleter = { valeur: null };

/** Les délais relevés sur les pièces, poste par poste. */
export function grilleDesDelais(): TableauACompleter {
  const d = (valeur: number, calcul: string, indice: string) => [aSaisir(valeur, calcul, { ...enJours, indice })];
  const demiMois = JOURS_DU_MOIS_COMMERCIAL / 2;
  return {
    titre: "Les délais de l'année type, relevés sur les pièces",
    colonnes: ["Délai"],
    lignes: [
      { libelle: "Stock de composants", cellules: d(x.delais.stock, `un mois de consommation qui descend à zéro : en moyenne ${jours(STOCK_EN_JOURS_DE_CONSOMMATION)}`, "le stock moyen, entre une livraison et la suivante") },
      { libelle: "Clients : CampusTech", cellules: d(x.delais.campustech, `facturée le ${CAMPUSTECH.jourDeFacturation}, la facture de juillet réglée le ${factureEtReglement("juillet").reglement} : ${jours(CAMPUSTECH.delai)}, et non les ${DELAI_CONVENU_DE_CAMPUSTECH} du contrat`, "le délai qu'elle tient, lu sur son compte") },
      { libelle: "Clients : les particuliers", cellules: d(0, "ils paient à la commande : 0 jour", "le jour où ils paient") },
      { libelle: "TVA déductible", cellules: d(DELAI_DE_LA_TVA, `née en moyenne le ${demiMois}, récupérée le ${JOUR_DE_PAIEMENT_DE_LA_TVA} du mois suivant : ${demiMois} + ${JOUR_DE_PAIEMENT_DE_LA_TVA} = ${jours(DELAI_DE_LA_TVA)}`, "du milieu du mois au jour de la déclaration") },
      { libelle: "Fournisseur de composants", cellules: d(x.delais.fournisseur, `payé à ${jours(ELECTRO_COMPOSANTS.delai)} de sa facture`, "le délai de la facture") },
      { libelle: "TVA collectée", cellules: d(DELAI_DE_LA_TVA, `née en moyenne le ${demiMois}, payée le ${JOUR_DE_PAIEMENT_DE_LA_TVA} du mois suivant : ${jours(DELAI_DE_LA_TVA)}`, "du milieu du mois au jour du paiement") },
      { libelle: "Dette de salaires nets", cellules: d(DELAI_DES_SALAIRES_NETS, `du ${demiMois} au ${PAIE_DU_MOIS.jourDuVirement} : ${jours(DELAI_DES_SALAIRES_NETS)}`, "du milieu du mois travaillé au jour du virement") },
      { libelle: "Dette de cotisations", cellules: d(DELAI_DES_COTISATIONS, `du ${demiMois} au ${PAIE_DU_MOIS.jourDesCotisations} du mois suivant : ${jours(DELAI_DES_COTISATIONS)}`, "du milieu du mois travaillé au jour du versement") },
    ],
  };
}

const calculDuPoste = (p: PosteNormatif) => `${jours(p.delai)} × ${coef(p.coefficient)} = ${jours(p.jours)}`;
const calculDuCoefficient = (p: PosteNormatif) => `${eur(p.flux)} ÷ ${eur(x.caHt)} = ${coef(p.coefficient)}`;

/** Le tableau normatif, en jours de chiffre d'affaires hors taxes : rien n'y est rempli d'avance, sauf les délais. */
export function grilleNormativeDuBureau(): TableauACompleter {
  const ligne = (p: PosteNormatif) => {
    const delai: CelluleACompleter = { valeur: p.delai, ...enJours, horsTotal: true };
    const coefficient = aSaisir(p.coefficient, calculDuCoefficient(p), { unite: "", nature: "coefficient", horsTotal: true, tolerance: 0.0001, indice: `le flux du poste ÷ ${eur(x.caHt)}, à 4 décimales` });
    const j = aSaisir(p.jours, calculDuPoste(p), { ...enJours, tolerance: 0.01, indice: "le délai × le coefficient" });
    return { libelle: p.libelle, cellules: p.sens === "besoin" ? [delai, coefficient, j, vide] : [delai, coefficient, vide, j] };
  };
  const p = x.postes;
  return {
    titre: "Le BFR d'exploitation normatif de NOVA, en jours de chiffre d'affaires HT",
    colonnes: ["Délai", "Coefficient", "Besoin", "Ressource"],
    lignes: [
      ...p.map(ligne),
      {
        libelle: "Totaux",
        fort: true,
        totalDe: { plus: p.map((_, i) => i) },
        cellules: [
          vide,
          vide,
          aSaisir(x.besoins, `${p.filter((q) => q.sens === "besoin").map((q) => qte(q.jours)).join(" + ")} = ${jours(x.besoins)}`, { ...enJours, tolerance: 0.01 }),
          aSaisir(x.ressources, `${p.filter((q) => q.sens === "ressource").map((q) => qte(q.jours)).join(" + ")} = ${jours(x.ressources)}`, { ...enJours, tolerance: 0.01 }),
        ],
      },
      {
        libelle: "Part variable du BFRE (besoins − ressources)",
        fort: true,
        cellules: [vide, vide, aSaisir(x.joursVariables, `${qte(x.besoins)} − ${qte(x.ressources)} = ${jours(x.joursVariables)}`, { ...enJours, tolerance: 0.01, horsTotal: true, indice: "le total des besoins moins celui des ressources" }), vide],
      },
    ],
  };
}

/** La part fixe et le besoin en euros. */
export function grilleDuBesoinEnEuros(): TableauACompleter {
  const k = x.paie;
  return {
    titre: "La part fixe, puis le besoin en euros",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Dette moyenne de salaires nets", cellules: [aSaisir(k.salairesNets, `${eur(k.netAPayer)} × ${DELAI_DES_SALAIRES_NETS} ÷ ${JOURS_DU_MOIS_COMMERCIAL} = ${eur(k.salairesNets)}`, { indice: "le net du mois × son délai ÷ 30" })] },
      { libelle: "Dette moyenne de cotisations", cellules: [aSaisir(k.cotisations, `${eur(k.aVerser)} × ${DELAI_DES_COTISATIONS} ÷ ${JOURS_DU_MOIS_COMMERCIAL} = ${eur(k.cotisations)}`, { indice: "les cotisations du mois × leur délai ÷ 30" })] },
      { libelle: "Part fixe, une ressource", fort: true, totalDe: { plus: [0, 1] }, cellules: [aSaisir(x.partFixe, `${eur(k.salairesNets)} + ${eur(k.cotisations)} = ${eur(x.partFixe)}`, { indice: "les dettes de la paie" })] },
      { libelle: "Part variable, en euros", cellules: [aSaisir(x.partVariable, `${qte(x.joursVariables)} × ${eur(x.caHt)} ÷ 360 = ${eur(x.partVariable)}`, { indice: "les jours de la part variable × le chiffre d'affaires HT ÷ 360" })] },
      { libelle: "BFRE normatif", fort: true, totalDe: { plus: [3], moins: [2] }, cellules: [aSaisir(x.bfre, `${eur(x.partVariable)} − ${eur(x.partFixe)} = ${eur(x.bfre)}`, { indice: "la part variable, moins la part fixe" })] },
      {
        libelle: "BFRE normatif, en jours de chiffre d'affaires HT",
        cellules: [aSaisir(x.bfreEnJours, `${eur(x.bfre)} ÷ ${eur(x.caHt)} × 360 = ${jours(x.bfreEnJours)}`, { ...enJours, tolerance: 0.01, horsTotal: true, indice: "le besoin ÷ le chiffre d'affaires HT × 360" })],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

export const LE_BESOIN_DE_L_ANNEE_TYPE: Bureau = {
  code: "le-besoin-de-l-annee-type",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-bfr-d-exploitation-normatif"],
  commanditaire: "Le président",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Au bureau : le besoin de l'année type",
  accroche: "La banque veut le besoin en fonds de roulement normatif de NOVA. Relevez les délais sur les pièces, écartez ce qui ne se répète pas, dressez le tableau, puis répondez au président.",
  objectifs: [
    "Trier les pièces d'un dossier : un poste variable du besoin, la part fixe, ce qui n'entre pas dans le calcul",
    "Relever sur des pièces le temps d'écoulement de chaque poste d'exploitation",
    "Dresser le tableau normatif, puis le besoin en euros, part fixe comprise",
    "Expliquer au président l'écart entre le besoin normatif et celui du bilan",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. Le bilan de N est fait ; la banque attend le besoin normatif avant de fixer le découvert de N+1.`,
    "Sur votre poste, la pile : le courriel du président dessus, la note de l'année type, puis les pièces. Certaines comptent, d'autres non. Rien ne vous dit lesquelles.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "la-pile",
      type: "classement",
      titre: "Classer la pile",
      consigne: "Ouvrez chaque pièce et dites ce qu'elle apporte au calcul : un délai d'un poste variable, la part fixe, ou rien, parce qu'elle n'est pas du cycle d'exploitation ou ne se répète pas.",
      pieces: ["courriel"],
      categories: [
        { code: "variable", libelle: "Un poste variable" },
        { code: "fixe", libelle: "La part fixe" },
        { code: "ecarter", libelle: "À écarter" },
      ],
      elements: [
        { code: "contrat", piece: "contrat", libelle: CONTRAT.titre, categorie: "variable", pourquoi: "Le contrat donne le volume et le prix de CampusTech : un client, un besoin qui suit les ventes. Son délai, lui, se vérifie sur le compte." },
        { code: "compte-campustech", piece: "compte-campustech", libelle: COMPTE_DE_CAMPUSTECH.titre, categorie: "variable", pourquoi: `Le compte dit le délai que CampusTech tient : ${jours(CAMPUSTECH.delai)}.` },
        { code: "electro", piece: "electro", libelle: FACTURE_D_ELECTRO.titre, categorie: "variable", pourquoi: `Le fournisseur finance ${jours(ELECTRO_COMPOSANTS.delai)} d'achats : une ressource qui suit les ventes.` },
        { code: "stock", piece: "stock", libelle: STOCK.titre, categorie: "variable", pourquoi: `Le stock de composants suit la production : ${jours(STOCK_EN_JOURS_DE_CONSOMMATION)} de consommation en moyenne.` },
        { code: "tva", piece: "tva", libelle: TVA.titre, categorie: "variable", pourquoi: `La TVA collectée et la TVA déductible suivent les ventes et les achats, à ${jours(DELAI_DE_LA_TVA)}.` },
        { code: "paie", piece: "paie", libelle: PAIE.titre, categorie: "fixe", pourquoi: "La paie ne suit pas les ventes : ses dettes sont la part fixe du besoin, en euros." },
        { code: "sonora", piece: "sonora", libelle: SONORA_EN_REDRESSEMENT.titre, categorie: "ecarter", pourquoi: "Une créance en redressement ne se répète pas : le besoin d'une année type ne la prolonge pas." },
        { code: "emprunt", libelle: `${EMPRUNT_DE_NOVA.titre}, ${eur(EMPRUNT.capitalRestantDu)} restant dus`, categorie: "ecarter", pourquoi: "Un emprunt finance l'entreprise : il n'est pas du cycle d'exploitation." },
      ],
      explication: [
        "Le besoin normatif ne garde que le cycle d'exploitation qui se répète : les clients, le stock, le fournisseur, la TVA, et la paie à part. Une créance en redressement et un emprunt n'en sont pas.",
      ],
    },
    {
      id: "les-delais",
      type: "etat",
      titre: "Relever les délais",
      consigne: "Pour chaque poste, saisissez son temps d'écoulement en jours, lu sur les pièces. La TVA et la paie naissent en moyenne au milieu du mois.",
      pieces: ["compte-campustech", "electro", "stock", "tva", "paie"],
      grille: grilleDesDelais(),
      explication: [
        `CampusTech tient ${jours(CAMPUSTECH.delai)}, et non les ${jours(DELAI_CONVENU_DE_CAMPUSTECH)} de son contrat : un besoin qui sert à prévoir se calcule sur le délai réel.`,
      ],
    },
    {
      id: "le-tableau",
      type: "etat",
      titre: "Dresser le tableau normatif",
      consigne: "Pour chaque poste, calculez son coefficient de structure, le flux du poste rapporté au chiffre d'affaires hors taxes, à 4 décimales, puis ses jours de chiffre d'affaires. Puis les totaux et la part variable.",
      pieces: ["annee-type"],
      grille: grilleNormativeDuBureau(),
      explication: [
        `La part variable du besoin est de ${jours(x.joursVariables)} de chiffre d'affaires hors taxes. CampusTech à elle seule en pèse ${jours(x.poste("campustech").jours)}.`,
      ],
    },
    {
      id: "le-besoin",
      type: "etat",
      titre: "Le besoin en euros",
      consigne: "Calculez les dettes moyennes de la paie, en mois de 30 jours, la part fixe, la part variable en euros, puis le BFRE normatif, en euros et en jours de chiffre d'affaires hors taxes.",
      pieces: ["paie", "annee-type"],
      grille: grilleDuBesoinEnEuros(),
      explication: [`Le besoin normatif de NOVA est de ${eur(x.bfre)}, ${jours(x.bfreEnJours)} de chiffre d'affaires hors taxes : la part fixe de la paie en finance une part.`],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez au président, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "le-besoin",
          question: "Quel besoin en fonds de roulement normatif le président annonce-t-il à la banque ?",
          options: [
            { texte: eur(x.bfre), juste: true, retour: `Oui : ${eur(x.partVariable)} de part variable, moins ${eur(x.partFixe)} de part fixe.` },
            { texte: `${eur(BILAN)}, celui du bilan du 31 décembre`, juste: false, retour: "Non : le bilan est la photo d'un jour, avec la créance de Sonora et un stock bas. La banque demande un besoin de régime de croisière." },
            { texte: `${eur(AU_DELAI_CONVENU.bfre)}, CampusTech payant à ${jours(DELAI_CONVENU_DE_CAMPUSTECH)}`, juste: false, retour: "Non : c'est le délai du contrat, pas celui que CampusTech tient. Le besoin se calcule sur le délai réel." },
            { texte: `${eur(x.partVariable)}, la part variable du besoin`, juste: false, retour: "Non : la paie, que NOVA règle après le travail, finance une part du besoin. La part fixe se retranche." },
          ],
        },
        {
          id: "campustech",
          question: "Que vaudrait le besoin si CampusTech payait au délai de son contrat ?",
          options: [
            { texte: eur(AU_DELAI_CONVENU.bfre), juste: true, retour: `Oui : ${eur(auCentime(x.bfre - AU_DELAI_CONVENU.bfre))} de moins. Faire tenir son délai à CampusTech est le premier levier du président.` },
            { texte: `${eur(x.bfre)}, le délai d'un client ne change pas le besoin`, juste: false, retour: "Non : chaque jour de crédit au client se finance. Le délai de CampusTech pèse sur le besoin, à son coefficient." },
            { texte: `${eur(auCentime(x.bfre * DELAI_CONVENU_DE_CAMPUSTECH / CAMPUSTECH.delai))}, le besoin au prorata du délai convenu et du délai réel`, juste: false, retour: "Non : seul le poste de CampusTech dépend de son délai ; les autres postes ne bougent pas." },
          ],
        },
        {
          id: "sonora",
          question: `Pourquoi la créance de Sonora, ${eur(SONORA_IMPAYEE.ttc)}, n'entre-t-elle pas dans le calcul ?`,
          options: [
            { texte: "Elle ne se répète pas", juste: true, retour: "Oui : le besoin normatif est celui d'une année type. Une créance en redressement relève de la dépréciation, pas du régime de croisière." },
            { texte: "Elle est toutes taxes comprises, et le tableau compte en hors taxes", juste: false, retour: "Non : les créances clients entrent toutes taxes comprises, rapportées au chiffre d'affaires hors taxes. La TVA n'est pas la raison." },
            { texte: "Elle est déjà dans la part fixe du besoin, avec la paie", juste: false, retour: "Non : la part fixe ne compte que les dettes de la paie, qui ne suivent pas les ventes." },
          ],
        },
      ],
      explication: [`Votre réponse : un besoin normatif de ${eur(x.bfre)}, calculé sur le délai que CampusTech tient ; Sonora et l'emprunt n'y entrent pas.`],
    },
  ],
};
