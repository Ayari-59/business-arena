import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { dateDe } from "../chapitres/la-cloture";
import { eur } from "../enquetes/lignes-du-dossier";
import { auCentime, type DateDuCours } from "../monde/amortissement";
import { affectationDuBeneficeDeN, DIVIDENDE_DEMANDE_PAR_ACTION } from "../monde/comptabilite-approfondie";
import { empruntALaCloture } from "../monde/emprunt";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import { tableauDeFinancement } from "../monde/tableaux-de-flux";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LE TABLEAU DE FINANCEMENT DE NOVA (comptabilité générale, palier 4 ; la suite du chapitre
 * « Le tableau de financement »).
 *
 * Début avril N+1, l'expert-comptable de NOVA prépare la liasse et demande le tableau de financement du
 * premier exercice. L'élève reçoit la pile (le courriel, le bilan fonctionnel détaillé, la note de la
 * capacité d'autofinancement, la facture de la ligne, les échéances de l'emprunt, le projet
 * d'affectation), trie ce qui entre dans chaque partie et ce qui n'y entre pas, dresse les deux parties,
 * puis répond. Le cas du chapitre change une seule hypothèse ; le bureau fait trier les pièces, avec
 * leurs pièges : la TVA de la ligne, les intérêts, la dépréciation, le dividende voté en N+1.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : le tableau de financement du cours
 * (monde/tableaux-de-flux.ts, `tableauDeFinancement`), sur la clôture de NOVA.
 */

const f = EXERCICE_DE_NOVA;
const t = tableauDeFinancement(f);
const k = t.k;
const s = k.soldes;
const fo = k.fonctionnel;
const p2 = t.partie2;
const e = empruntALaCloture(f.pret);
const dividende = affectationDuBeneficeDeN().dividendes;

/** Le jour où l'élève ouvre la pile (hypothèse du bureau). */
export const JOUR_DU_TABLEAU_DE_FINANCEMENT: DateDuCours = { jour: 2, mois: 4, exercice: 1 };
const JOUR = dateDe(JOUR_DU_TABLEAU_DE_FINANCEMENT);
const AU_31_DECEMBRE = `${dateDe(f.cloture)} N`;

const debit = (...comptes: string[]) => auCentime(comptes.reduce((x, c) => x + (s[c] ?? 0), 0));
const credit = (...comptes: string[]) => auCentime(-comptes.reduce((x, c) => x + (s[c] ?? 0), 0));

/** Les postes du bilan fonctionnel, lus sur les soldes de la clôture. */
const P = {
  stock: debit("31"),
  clientsBruts: debit("411", "416", "418"),
  depreciation: credit("491"),
  tvaDeductible: debit("44586"),
  chargeConstateeDAvance: debit("486"),
  fournisseurs: credit("401", "408"),
  dettesSociales: credit("431", "437", "442"),
  tvaADecaisser: credit("4455", "44587"),
  produitConstateDAvance: credit("487"),
  impot: credit("444"),
  interetsCourus: credit("1688"),
  compteATerme: debit(f.placement.compte, f.placement.compteDesInteretsCourus),
  banque: debit("512"),
};

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel de l'expert-comptable",
  de: "L'expert-comptable de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "Le tableau de financement de N",
  paragraphes: [
    "Bonjour,",
    "Pour la liasse et pour la banque, il me faut le tableau de financement du premier exercice, ses deux parties. NOVA est née le 2 janvier : le bilan d'ouverture est vide.",
    "Je vous joins ce que j'ai. Tout ne va pas dans le tableau : triez d'abord. Le président voudra ensuite savoir à quoi a servi le fonds de roulement de l'année.",
    "Bien cordialement. L'expert-comptable",
  ],
};

const BILAN: PieceDuBureau = {
  code: "bilan",
  nature: "note",
  titre: "Le bilan fonctionnel détaillé au 31 décembre N",
  de: "Le service comptable de NOVA",
  a: "L'expert-comptable",
  date: AU_31_DECEMBRE,
  objet: "Les postes du bas du bilan",
  montants: [
    { libelle: "Stock de composants", montant: P.stock },
    { libelle: "Clients, en brut", montant: P.clientsBruts },
    { libelle: "Dépréciation de la créance de Sonora", montant: P.depreciation },
    { libelle: "TVA sur la facture non parvenue", montant: P.tvaDeductible },
    { libelle: "Charge constatée d'avance", montant: P.chargeConstateeDAvance },
    { libelle: "Fournisseurs, factures non parvenues comprises", montant: P.fournisseurs },
    { libelle: "Dettes sociales", montant: P.dettesSociales },
    { libelle: "TVA à décaisser", montant: P.tvaADecaisser },
    { libelle: "Produit constaté d'avance", montant: P.produitConstateDAvance },
    { libelle: "Impôt sur les sociétés dû", montant: P.impot },
    { libelle: "Intérêts courus de l'emprunt", montant: P.interetsCourus },
    { libelle: "Compte à terme et ses intérêts courus", montant: P.compteATerme },
    { libelle: "Banque", montant: P.banque },
  ],
  mention: "Aucun découvert au 31 décembre.",
};

const CAF: PieceDuBureau = {
  code: "caf",
  nature: "note",
  titre: "La capacité d'autofinancement de N",
  de: "Le service comptable de NOVA",
  a: "L'expert-comptable",
  date: AU_31_DECEMBRE,
  paragraphes: ["Méthode additive : le résultat net, plus les dotations aux amortissements, aux dépréciations et aux provisions. Aucune reprise, aucune cession."],
  montants: [
    { libelle: "Résultat net", montant: k.resultatNet },
    { libelle: "Dotations", montant: k.caf.dotations },
    { libelle: "Capacité d'autofinancement", montant: t.ressources.caf, fort: true },
  ],
};

const FACTURE: PieceDuBureau = {
  code: "facture",
  nature: "facture",
  titre: "Facture de la ligne de montage",
  de: "Le fabricant de la ligne",
  a: "NOVA",
  date: `${dateDe(f.equipement.dateDAchat)} N`,
  objet: "Ligne de montage",
  montants: [
    { libelle: "Hors taxes", montant: f.equipement.ht },
    { libelle: "TVA", montant: f.equipement.tva },
    { libelle: "Toutes taxes comprises", montant: f.equipement.ttc, fort: true },
  ],
  mention: "La TVA a été récupérée sur les déclarations de N.",
};

const EMPRUNT: PieceDuBureau = {
  code: "emprunt",
  nature: "extrait",
  titre: "L'emprunt en N",
  de: "La banque de NOVA",
  a: "NOVA",
  date: AU_31_DECEMBRE,
  lignes: [
    { date: `${dateDe(f.pret.versement)} N`, libelle: "Fonds versés", montant: f.pret.capital },
    ...e.echeances.map((y) => ({ date: `${dateDe(y.date)} N`, libelle: `Échéance n° ${y.numero}, dont ${eur(y.interets)} d'intérêts`, montant: -y.echeance })),
  ],
  montants: [
    { libelle: "Capital remboursé en N", montant: e.capitalRembourse },
    { libelle: "Intérêts payés en N", montant: e.interetsPayes },
    { libelle: "Capital restant dû au 31 décembre N", montant: e.capitalRestantDu, fort: true },
  ],
};

const AFFECTATION: PieceDuBureau = {
  code: "affectation",
  nature: "lettre",
  titre: "Le projet d'affectation du bénéfice de N",
  de: "Le président de NOVA",
  a: "Les associés",
  date: JOUR,
  objet: "Assemblée de juin N+1",
  paragraphes: [`Je proposerai à l'assemblée de juin N+1 un dividende de ${eur(DIVIDENDE_DEMANDE_PAR_ACTION)} par action, soit ${eur(dividende)}. Les statuts : un apport de ${eur(f.apport.montant)} au capital, le ${dateDe(f.apport.date)} N.`],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, BILAN, CAF, FACTURE, EMPRUNT, AFFECTATION];

// ─────────────────────────────────────────────────────────────────────────────
// LE TRI
// ─────────────────────────────────────────────────────────────────────────────

const PLACES = [
  { code: "emploi", libelle: "Emploi stable" },
  { code: "ressource", libelle: "Ressource stable" },
  { code: "besoin", libelle: "Variation du besoin" },
  { code: "tresorerie", libelle: "Variation de la trésorerie" },
  { code: "rien", libelle: "N'entre pas dans le tableau" },
] as const;

type Place = (typeof PLACES)[number]["code"];

const ELEMENTS: { code: string; libelle: string; montant: number; piece: string; categorie: Place; pourquoi: string }[] = [
  { code: "ligne", libelle: "La ligne de montage, hors taxes", montant: t.emplois.acquisitions, piece: "facture", categorie: "emploi", pourquoi: "Une acquisition d'immobilisation, pour son prix hors taxes : un emploi stable de la partie I." },
  { code: "tva-ligne", libelle: "La TVA de la ligne", montant: f.equipement.tva, piece: "facture", categorie: "rien", pourquoi: "Payée puis récupérée dans l'année : au 31 décembre, il n'en reste rien." },
  { code: "apport", libelle: "L'apport des associés au capital", montant: t.ressources.augmentationDeCapital, piece: "affectation", categorie: "ressource", pourquoi: "Le bilan d'ouverture est vide : l'apport de la création est une augmentation de capital de l'année." },
  { code: "emprunt", libelle: "L'emprunt reçu", montant: t.ressources.nouveauxEmprunts, piece: "emprunt", categorie: "ressource", pourquoi: "Un nouvel emprunt, pour son capital reçu : une ressource stable." },
  { code: "rembourse", libelle: "Le capital remboursé en N", montant: t.emplois.remboursements, piece: "emprunt", categorie: "emploi", pourquoi: "Le remboursement d'une dette financière : un emploi stable." },
  { code: "interets", libelle: "Les intérêts payés en N", montant: e.interetsPayes, piece: "emprunt", categorie: "rien", pourquoi: "Des charges : ils sont déjà dans le résultat, donc dans la capacité d'autofinancement." },
  { code: "caf", libelle: "La capacité d'autofinancement", montant: t.ressources.caf, piece: "caf", categorie: "ressource", pourquoi: "Ce que l'activité de l'année laisse : la première ressource stable." },
  { code: "dividende", libelle: "Le dividende proposé sur le bénéfice de N", montant: dividende, piece: "affectation", categorie: "rien", pourquoi: "Il sera voté et payé en N+1 : il entrera dans le tableau de N+1, pas dans celui de N." },
  { code: "stock", libelle: "Le stock de composants", montant: P.stock, piece: "bilan", categorie: "besoin", pourquoi: "Un actif d'exploitation : la variation du stock est une variation du besoin." },
  { code: "clients", libelle: "Les clients, en brut", montant: P.clientsBruts, piece: "bilan", categorie: "besoin", pourquoi: "Une créance d'exploitation, en valeur brute : une variation du besoin." },
  { code: "depreciation", libelle: "La dépréciation de la créance de Sonora", montant: P.depreciation, piece: "bilan", categorie: "rien", pourquoi: "Elle est déjà dans la capacité d'autofinancement ; la partie II lit les créances en brut." },
  { code: "fournisseurs", libelle: "Les fournisseurs", montant: P.fournisseurs, piece: "bilan", categorie: "besoin", pourquoi: "Une dette d'exploitation : elle réduit le besoin." },
  { code: "impot", libelle: "L'impôt sur les sociétés dû", montant: P.impot, piece: "bilan", categorie: "besoin", pourquoi: "Une dette hors exploitation : une variation du besoin hors exploitation." },
  { code: "compte-a-terme", libelle: "Le compte à terme et ses intérêts courus", montant: P.compteATerme, piece: "bilan", categorie: "tresorerie", pourquoi: "Un placement à moins d'un an : de la trésorerie, comme au bilan fonctionnel." },
  { code: "banque", libelle: "La banque", montant: P.banque, piece: "bilan", categorie: "tresorerie", pourquoi: "Les disponibilités : la variation de la trésorerie." },
];

// ─────────────────────────────────────────────────────────────────────────────
// LES DEUX PARTIES
// ─────────────────────────────────────────────────────────────────────────────

const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });

/** La partie I : les emplois et les ressources stables, la variation du fonds de roulement. */
export function grilleDeLaPartieUn(): TableauACompleter {
  return {
    titre: "Tableau de financement, partie I : emplois et ressources stables de N",
    colonnes: ["Montant"],
    lignes: [
      /* 0 */ { libelle: "Distributions mises en paiement", cellules: [{ valeur: t.emplois.dividendes }] },
      /* 1 */ { libelle: "Acquisitions d'immobilisations", cellules: [saisir(t.emplois.acquisitions, `la ligne, hors taxes : ${eur(t.emplois.acquisitions)}`, "le prix hors taxes des immobilisations achetées")] },
      /* 2 */ { libelle: "Remboursements de dettes financières", cellules: [saisir(t.emplois.remboursements, `le capital des échéances de N : ${eur(t.emplois.remboursements)}`, "le capital remboursé, sans les intérêts")] },
      /* 3 */ { libelle: "Total des emplois stables", fort: true, totalDe: { plus: [0, 1, 2] }, cellules: [saisir(t.totalDesEmplois, `${eur(t.emplois.acquisitions)} + ${eur(t.emplois.remboursements)} = ${eur(t.totalDesEmplois)}`, "la somme des emplois")] },
      /* 4 */ { libelle: "Capacité d'autofinancement", cellules: [saisir(t.ressources.caf, `celle de la note : ${eur(t.ressources.caf)}`, "la ressource que l'activité dégage")] },
      /* 5 */ { libelle: "Cessions d'immobilisations", cellules: [{ valeur: t.ressources.cessions }] },
      /* 6 */ { libelle: "Augmentation de capital", cellules: [saisir(t.ressources.augmentationDeCapital, `l'apport de la création : ${eur(t.ressources.augmentationDeCapital)}`, "les apports des associés de l'année")] },
      /* 7 */ { libelle: "Augmentation des dettes financières", cellules: [saisir(t.ressources.nouveauxEmprunts, `l'emprunt reçu : ${eur(t.ressources.nouveauxEmprunts)}`, "le capital des emprunts reçus")] },
      /* 8 */ {
        libelle: "Total des ressources stables",
        fort: true,
        totalDe: { plus: [4, 5, 6, 7] },
        cellules: [saisir(t.totalDesRessources, `${eur(t.ressources.caf)} + ${eur(t.ressources.augmentationDeCapital)} + ${eur(t.ressources.nouveauxEmprunts)} = ${eur(t.totalDesRessources)}`, "la somme des ressources")],
      },
      /* 9 */ {
        libelle: "Variation du fonds de roulement net global",
        fort: true,
        totalDe: { plus: [8], moins: [3] },
        cellules: [saisir(t.variationDuFondsDeRoulement, `${eur(t.totalDesRessources)} − ${eur(t.totalDesEmplois)} = ${eur(t.variationDuFondsDeRoulement)}`, "les ressources moins les emplois")],
      },
    ],
  };
}

/** La partie II : l'emploi de la variation du fonds de roulement. */
export function grilleDeLaPartieDeux(): TableauACompleter {
  return {
    titre: "Tableau de financement, partie II : emploi de la variation du fonds de roulement",
    colonnes: ["Montant"],
    lignes: [
      /* 0 */ { libelle: "Variation des stocks", cellules: [saisir(p2.stocks, `le stock du 31 décembre, l'ouverture étant vide : ${eur(p2.stocks)}`, "le stock de clôture moins celui d'ouverture")] },
      /* 1 */ {
        libelle: "Variation des créances d'exploitation, en brut",
        cellules: [saisir(p2.creancesDExploitation, `${eur(P.clientsBruts)} + ${eur(P.tvaDeductible)} + ${eur(P.chargeConstateeDAvance)} = ${eur(p2.creancesDExploitation)}`, "les clients en brut, la TVA déductible et la charge constatée d'avance")],
      },
      /* 2 */ {
        libelle: "Variation des dettes d'exploitation",
        cellules: [saisir(p2.dettesDExploitation, `${eur(P.fournisseurs)} + ${eur(P.dettesSociales)} + ${eur(P.tvaADecaisser)} + ${eur(P.produitConstateDAvance)} = ${eur(p2.dettesDExploitation)}`, "les fournisseurs, les dettes sociales, la TVA et le produit constaté d'avance")],
      },
      /* 3 */ { libelle: "Variation du besoin d'exploitation (A)", fort: true, totalDe: { plus: [0, 1], moins: [2] }, cellules: [saisir(p2.variationDExploitation, `${eur(p2.stocks)} + ${eur(p2.creancesDExploitation)} − ${eur(p2.dettesDExploitation)} = ${eur(p2.variationDExploitation)}`, "les actifs d'exploitation moins les dettes d'exploitation")] },
      /* 4 */ { libelle: "Variation des autres débiteurs", cellules: [saisir(p2.autresDebiteurs, "aucune créance hors exploitation : zéro", "les créances qui ne naissent pas de l'exploitation")] },
      /* 5 */ { libelle: "Variation des autres créditeurs", cellules: [saisir(p2.autresCrediteurs, `${eur(P.impot)} d'impôt + ${eur(P.interetsCourus)} d'intérêts courus = ${eur(p2.autresCrediteurs)}`, "les dettes hors exploitation")] },
      /* 6 */ { libelle: "Variation du besoin hors exploitation (B)", fort: true, totalDe: { plus: [4], moins: [5] }, cellules: [saisir(p2.variationHorsExploitation, `${eur(p2.autresDebiteurs)} − ${eur(p2.autresCrediteurs)} = ${eur(p2.variationHorsExploitation)}`, "les autres débiteurs moins les autres créditeurs, en négatif s'il le faut")] },
      /* 7 */ { libelle: "Variation des disponibilités", cellules: [saisir(p2.disponibilites, `${eur(P.banque)} + ${eur(P.compteATerme)} = ${eur(p2.disponibilites)}`, "la banque et le compte à terme")] },
      /* 8 */ { libelle: "Variation des concours bancaires", cellules: [{ valeur: p2.concoursBancaires }] },
      /* 9 */ { libelle: "Variation de la trésorerie (C)", fort: true, totalDe: { plus: [7], moins: [8] }, cellules: [saisir(p2.variationDeTresorerie, eur(p2.variationDeTresorerie), "les disponibilités moins les concours bancaires")] },
      /* 10 */ {
        libelle: "Variation du fonds de roulement net global (A + B + C)",
        fort: true,
        totalDe: { plus: [3, 6, 9] },
        cellules: [saisir(p2.total, `${eur(p2.variationDExploitation)} − ${eur(-p2.variationHorsExploitation)} + ${eur(p2.variationDeTresorerie)} = ${eur(p2.total)}, celle de la partie I`, "la somme des trois variations")],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

const pctDe = (x: number, y: number) => `${(Math.round((x / y) * 1_000) / 10).toLocaleString("fr-FR")} %`;

export const LE_TABLEAU_DE_FINANCEMENT_DE_NOVA: Bureau = {
  code: "le-tableau-de-financement-de-nova",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-tableau-de-financement"],
  commanditaire: "L'expert-comptable",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Au bureau : le tableau de financement de NOVA",
  accroche: "L'expert-comptable veut le tableau de financement du premier exercice. Triez les pièces, dressez les deux parties, puis dites à quoi a servi le fonds de roulement de l'année.",
  objectifs: [
    "Trier ce qui entre dans un tableau de financement, et ce qui n'y entre pas",
    "Dresser la partie I : emplois, ressources stables et variation du fonds de roulement",
    "Dresser la partie II en valeurs brutes, et retrouver la même variation",
    "Dire à quoi a servi le fonds de roulement de l'année",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. Les comptes de N sont arrêtés ; l'expert-comptable prépare la liasse.`,
    "Sur votre poste, la pile : son courriel dessus, le bilan fonctionnel détaillé, la note de la capacité d'autofinancement, la facture de la ligne, l'emprunt et le projet d'affectation. Tout ne va pas dans le tableau.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "le-tri",
      type: "classement",
      titre: "Trier les montants",
      consigne: "Pour chaque montant de la pile, dites où il entre dans le tableau de financement de N, ou s'il n'y entre pas.",
      pieces: ["courriel"],
      categories: PLACES,
      elements: ELEMENTS,
      explication: [
        "La partie I retient les flux stables de l'année ; la partie II, les postes du bas du bilan en valeurs brutes. Ce que la capacité d'autofinancement contient déjà, les intérêts et la dépréciation, n'y revient pas ; ce qui relève de N+1 non plus.",
      ],
    },
    {
      id: "la-partie-un",
      type: "etat",
      titre: "Dresser la partie I",
      consigne: "Complétez les emplois et les ressources stables de N, puis la variation du fonds de roulement. Une ligne sans objet vaut zéro.",
      pieces: ["caf", "facture", "emprunt"],
      grille: grilleDeLaPartieUn(),
      reussite: "La partie I est juste.",
      explication: [`Le fonds de roulement a augmenté de ${eur(t.variationDuFondsDeRoulement)} : c'est le fonds de roulement du 31 décembre, ${eur(fo.fondsDeRoulement)}, puisque l'ouverture est vide.`],
    },
    {
      id: "la-partie-deux",
      type: "etat",
      titre: "Dresser la partie II",
      consigne: "Complétez l'emploi de la variation du fonds de roulement, en valeurs brutes. Un dégagement s'écrit en négatif.",
      pieces: ["bilan"],
      grille: grilleDeLaPartieDeux(),
      reussite: "La partie II retombe sur la variation de la partie I.",
      explication: [`Les trois variations retombent sur ${eur(p2.total)}. Le besoin d'exploitation en prend ${eur(p2.variationDExploitation)}, les dettes hors exploitation en rendent ${eur(-p2.variationHorsExploitation)}, la trésorerie garde le reste.`],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre à l'expert-comptable",
      consigne: "Répondez, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "a-quoi",
          question: "À quoi a surtout servi le fonds de roulement de l'année ?",
          options: [
            { texte: "À constituer de la trésorerie", juste: true, retour: `Oui : ${eur(p2.variationDeTresorerie)} de trésorerie, soit ${pctDe(p2.variationDeTresorerie, p2.total)} de la variation. Le besoin n'en prend que ${eur(p2.variationDuBesoin)}.` },
            { texte: "À financer le besoin d'exploitation", juste: false, retour: `Non : le besoin d'exploitation ne prend que ${eur(p2.variationDExploitation)}, et les dettes hors exploitation en rendent une partie.` },
            { texte: "À payer la ligne de montage et à rembourser l'emprunt", juste: false, retour: "Non : ce sont les emplois de la partie I, déjà retranchés. La partie II dit à quoi sert ce qui reste." },
            { texte: "À verser le dividende que l'assemblée votera en juin sur le bénéfice de N", juste: false, retour: `Non : le dividende, ${eur(dividende)}, sera payé en N+1. Il pèsera sur le tableau de N+1.` },
          ],
        },
        {
          id: "la-ressource",
          question: "Quelle est la première ressource stable de l'exercice ?",
          options: [
            { texte: "L'apport des associés", juste: true, retour: `Oui : ${eur(t.ressources.augmentationDeCapital)}, devant l'emprunt, ${eur(t.ressources.nouveauxEmprunts)}, et la capacité d'autofinancement, ${eur(t.ressources.caf)}. Une année de création.` },
            { texte: "La capacité d'autofinancement", juste: false, retour: `Non : ${eur(t.ressources.caf)}, c'est beaucoup pour une première année, mais moins que l'apport.` },
            { texte: "L'emprunt, net de ce qui a été remboursé dans l'année", juste: false, retour: `Non : le tableau ne compense pas. L'emprunt reçu, ${eur(t.ressources.nouveauxEmprunts)}, est une ressource ; le capital remboursé, un emploi.` },
          ],
        },
        {
          id: "la-depreciation",
          question: "Pourquoi la dépréciation de Sonora n'apparaît-elle pas dans la partie II ?",
          options: [
            { texte: "Elle est déjà dans la CAF", juste: true, retour: "Oui : la capacité d'autofinancement l'a ajoutée au résultat. La partie II lit donc les créances en brut, sans la déduire une seconde fois." },
            { texte: "Elle n'est pas encore une perte certaine", juste: false, retour: "Non : c'est vrai, mais ce n'est pas la raison. Une perte certaine passerait elle aussi par le résultat." },
            { texte: "Elle concerne l'exercice suivant, quand la créance sera soldée", juste: false, retour: "Non : elle est constatée en N, dans les comptes de N." },
          ],
        },
      ],
      explication: [`Votre réponse : le fonds de roulement a augmenté de ${eur(t.variationDuFondsDeRoulement)}, financé surtout par l'apport ; il a servi pour l'essentiel à constituer ${eur(p2.variationDeTresorerie)} de trésorerie.`],
    },
  ],
};
