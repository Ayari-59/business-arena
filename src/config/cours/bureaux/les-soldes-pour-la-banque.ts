import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { dateDe } from "../chapitres/la-cloture";
import { eur, pct, terme } from "../enquetes/lignes-du-dossier";
import { auCentime, type DateDuCours } from "../monde/amortissement";
import { cloture, partageDeLaValeurAjoutee } from "../monde/cloture";
import { empruntALaCloture } from "../monde/emprunt";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LES SOLDES POUR LA BANQUE (comptabilité générale, palier 4 ; la suite du chapitre « Soldes
 * intermédiaires de gestion et CAF »).
 *
 * Fin janvier N+1, la banque de NOVA prépare le dossier d'un nouveau concours : elle demande les soldes
 * intermédiaires de gestion et la capacité d'autofinancement du premier exercice, et deux ratios. L'élève
 * reçoit la pile (le courriel du président, la lettre de la banque, le compte de résultat compte par
 * compte, les notes de la clôture, l'avis du compte à terme), range chaque compte dans son solde, dresse
 * la cascade, calcule la CAF par ses deux méthodes, puis répond à la banque.
 *
 * Le cas du chapitre (« Quand le taux monte ») part des soldes déjà rangés ; le bureau part des comptes,
 * avec leurs pièges : la variation de stock au crédit, l'escompte accordé, la dépréciation d'une créance,
 * la provision, des intérêts courus qui ne sont pas encore encaissés.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : la clôture de NOVA (monde/cloture.ts : les
 * soldes, `sig`, `caf`, `partageDeLaValeurAjoutee`) et le contrat de prêt (monde/emprunt.ts).
 */

const f = EXERCICE_DE_NOVA;
const k = cloture(f);
const s = k.soldes;
const sig = k.sig;
const caf = k.caf;
const e = empruntALaCloture(f.pret);
const partage = partageDeLaValeurAjoutee(sig);

/** Le jour où l'élève ouvre la pile (hypothèse du bureau). */
export const JOUR_DES_SOLDES: DateDuCours = { jour: 26, mois: 1, exercice: 1 };
/** Le jour où la banque a écrit (hypothèse du bureau). */
const JOUR_DE_LA_LETTRE: DateDuCours = { jour: 20, mois: 1, exercice: 1 };
const JOUR = dateDe(JOUR_DES_SOLDES);
const AU_31_DECEMBRE = `${dateDe(f.cloture)} N`;

/** Le solde d'un compte de gestion, du côté où il se lit : un produit au crédit, une charge au débit. */
const montantDe = (compte: string) => auCentime(compte.startsWith("7") ? -(s[compte] ?? 0) : (s[compte] ?? 0));

/** Le capital que NOVA remboursera en N+1 : les échéances des douze mois qui viennent. */
const annuiteDeCapital = e.partAMoinsDUnAn;
const tauxDeValeurAjoutee = sig.valeurAjoutee / sig.production;
const couvertureDesRemboursements = Math.round((caf.additive / annuiteDeCapital) * 100) / 100;

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
  objet: "Le dossier de la banque",
  paragraphes: [
    "Bonjour,",
    "La banque prépare le dossier de la seconde ligne et me demande nos soldes intermédiaires de gestion et notre capacité d'autofinancement. Sa lettre est jointe.",
    "Partez du compte de résultat, compte par compte, et des notes de la clôture : je veux des chiffres que la banque ne pourra pas discuter.",
    "Merci. Le président",
  ],
};

const LETTRE: PieceDuBureau = {
  code: "lettre",
  nature: "lettre",
  titre: "Lettre de la banque",
  de: "La chargée d'affaires de la banque de NOVA",
  a: "Le président de NOVA",
  date: dateDe(JOUR_DE_LA_LETTRE),
  objet: "Votre demande de financement",
  paragraphes: [
    "Monsieur le Président,",
    "Pour instruire votre demande, nous avons besoin des soldes intermédiaires de gestion de votre premier exercice, jusqu'au résultat net, et de votre capacité d'autofinancement, que nous recalculerons par les deux méthodes.",
    `Nous regarderons aussi votre taux de valeur ajoutée, et ce que votre capacité d'autofinancement représente face au capital que vous rembourserez en N+1 sur votre emprunt actuel, ${eur(annuiteDeCapital)}.`,
    "Veuillez agréer, Monsieur le Président, nos salutations distinguées.",
  ],
};

/** Les libellés des comptes de gestion, tels que le compte de résultat de NOVA les écrit. */
const LIBELLES: Readonly<Record<string, string>> = {
  "701": "Ventes de produits finis",
  "764": "Revenus du compte à terme",
  "601": "Achats de composants",
  "6031": "Variation du stock de composants",
  "606": "Achats non stockés (emballage, transport, énergie)",
  "6132": "Loyer du local",
  "616": "Assurance",
  "641": "Rémunérations du personnel",
  "645": "Charges sociales",
  "6811": "Dotation aux amortissements",
  "6815": "Dotation aux provisions",
  "6817": "Dotation aux dépréciations",
  "6611": "Intérêts de l'emprunt",
  "665": "Escomptes accordés",
  "695": "Impôt sur les sociétés",
};

/** Les comptes de gestion de l'exercice, produits d'abord, dans l'ordre du plan. */
const COMPTES = Object.keys(s)
  .filter((c) => /^[67]/.test(c) && Math.abs(s[c]!) > 0.004)
  .sort((a, b) => (a.startsWith("7") === b.startsWith("7") ? a.localeCompare(b) : a.startsWith("7") ? -1 : 1));

const COMPTE_DE_RESULTAT: PieceDuBureau = {
  code: "compte-de-resultat",
  nature: "balance",
  titre: "Le compte de résultat, compte par compte",
  de: "La comptabilité de NOVA",
  a: "Le service comptable",
  date: AU_31_DECEMBRE,
  comptes: COMPTES.map((compte) => ({ compte, intitule: LIBELLES[compte] ?? `Compte ${compte}`, debit: (s[compte] ?? 0) > 0 ? s[compte]! : 0, credit: (s[compte] ?? 0) < 0 ? -s[compte]! : 0 })),
  montants: [{ libelle: "Résultat net de l'exercice", montant: k.resultatNet, fort: true }],
  mention: "Premier exercice, du 1er janvier au 31 décembre N, travaux d'inventaire et impôt passés.",
};

const sonora = f.creances.find((c) => c.litigieuse)!;

const NOTES: PieceDuBureau = {
  code: "notes",
  nature: "note",
  titre: "Notes de la clôture",
  de: "Le service comptable de NOVA",
  a: "Le président",
  date: AU_31_DECEMBRE,
  objet: "Les comptes qui demandent une explication",
  paragraphes: [
    `Le 6031 est au crédit : aucun stock de composants à l'ouverture, ${eur(-montantDe("6031"))} en stock à la clôture. Les composants consommés sont les achats, moins ce stock.`,
    `Le 6817 : la créance de ${sonora.client}, en redressement judiciaire, dépréciée de ${eur(montantDe("6817"))}. Rien n'a été décaissé.`,
    `Le 6815 : la provision pour le litige d'un client, ${eur(montantDe("6815"))}. Rien n'a été décaissé non plus.`,
    `Le 665 : l'escompte accordé à ${sonora.client} pour un paiement rapide, ${eur(montantDe("665"))}.`,
    "Aucun impôt ni taxe n'était dû pour l'année de la création.",
  ],
};

const AVIS: PieceDuBureau = {
  code: "avis",
  nature: "avis",
  titre: "Avis du compte à terme",
  de: "La banque de NOVA",
  a: "NOVA",
  date: AU_31_DECEMBRE,
  objet: "Intérêts courus au 31 décembre",
  paragraphes: [`Votre compte à terme de ${eur(f.placement.montant)}, ouvert le ${dateDe(f.placement.date)}, a produit les intérêts ci-dessous. Ils vous seront versés à l'échéance, le ${dateDe(f.placement.echeance)}.`],
  montants: [{ libelle: "Intérêts courus au 31 décembre N", montant: montantDe("764"), fort: true }],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, LETTRE, COMPTE_DE_RESULTAT, NOTES, AVIS];

// ─────────────────────────────────────────────────────────────────────────────
// RANGER LES COMPTES
// ─────────────────────────────────────────────────────────────────────────────

const SOLDES = [
  { code: "production", libelle: "Production de l'exercice" },
  { code: "consommations", libelle: "Consommations en provenance des tiers" },
  { code: "personnel", libelle: "Charges de personnel" },
  { code: "dotations", libelle: "Dotations d'exploitation" },
  { code: "produits-financiers", libelle: "Produits financiers" },
  { code: "charges-financieres", libelle: "Charges financières" },
  { code: "impot", libelle: "Impôt sur les bénéfices" },
] as const;

/** Le solde de chaque compte, et pourquoi. */
const RANGEMENT: Readonly<Record<string, { solde: (typeof SOLDES)[number]["code"]; pourquoi: string }>> = {
  "701": { solde: "production", pourquoi: "Les ventes d'enceintes que NOVA fabrique : la production vendue." },
  "764": { solde: "produits-financiers", pourquoi: "Des intérêts d'un placement : un produit financier, même s'ils ne sont pas encore encaissés." },
  "601": { solde: "consommations", pourquoi: "Les achats de composants, consommés par la production." },
  "6031": { solde: "consommations", pourquoi: "La variation du stock corrige les achats : au crédit, elle diminue les consommations." },
  "606": { solde: "consommations", pourquoi: "Des achats non stockés, fournis par des tiers." },
  "6132": { solde: "consommations", pourquoi: "Un service extérieur : le loyer est une consommation en provenance des tiers." },
  "616": { solde: "consommations", pourquoi: "Un service extérieur : l'assurance." },
  "641": { solde: "personnel", pourquoi: "Les salaires bruts." },
  "645": { solde: "personnel", pourquoi: "Les charges sociales patronales, avec les salaires." },
  "6811": { solde: "dotations", pourquoi: "L'usure de la ligne de montage : une dotation d'exploitation, sous l'excédent brut." },
  "6815": { solde: "dotations", pourquoi: "Une provision pour un risque d'exploitation, le litige d'un client : sous l'excédent brut." },
  "6817": { solde: "dotations", pourquoi: "La dépréciation d'une créance client : une dotation d'exploitation, pas une consommation." },
  "6611": { solde: "charges-financieres", pourquoi: "Le coût de l'emprunt, payé et couru." },
  "665": { solde: "charges-financieres", pourquoi: "Un escompte accordé est le prix d'un paiement plus rapide : une charge financière, pas une réduction des ventes." },
  "695": { solde: "impot", pourquoi: "L'impôt sur les sociétés de l'exercice." },
};

// ─────────────────────────────────────────────────────────────────────────────
// LES SOLDES ET LA CAF
// ─────────────────────────────────────────────────────────────────────────────

const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });

/** La cascade des soldes, de la production au résultat net. */
export function grilleDesSoldes(): TableauACompleter {
  return {
    titre: "Les soldes intermédiaires de gestion du premier exercice",
    colonnes: ["Montant"],
    lignes: [
      /* 0 */ { libelle: "Production de l'exercice", cellules: [saisir(sig.production, `les ventes de produits finis, ${eur(sig.production)}`, "la production vendue, stockée et immobilisée")] },
      /* 1 */ {
        libelle: "Consommations en provenance des tiers",
        cellules: [saisir(sig.consommations, `${eur(montantDe("601"))} ${terme(montantDe("6031"))} + ${eur(montantDe("606"))} + ${eur(montantDe("6132"))} + ${eur(montantDe("616"))} = ${eur(sig.consommations)}`, "les achats corrigés du stock, et les services extérieurs")],
      },
      /* 2 */ { libelle: "Valeur ajoutée", fort: true, totalDe: { plus: [0], moins: [1] }, cellules: [saisir(sig.valeurAjoutee, `${eur(sig.production)} − ${eur(sig.consommations)} = ${eur(sig.valeurAjoutee)}`, "la production moins les consommations")] },
      /* 3 */ { libelle: "Impôts et taxes", cellules: [saisir(sig.impotsEtTaxes, "aucun l'année de la création : zéro", "les impôts autres que l'impôt sur les bénéfices")] },
      /* 4 */ { libelle: "Charges de personnel", cellules: [saisir(sig.personnel, `${eur(montantDe("641"))} + ${eur(montantDe("645"))} = ${eur(sig.personnel)}`, "les salaires et les charges sociales")] },
      /* 5 */ {
        libelle: "Excédent brut d'exploitation",
        fort: true,
        totalDe: { plus: [2], moins: [3, 4] },
        cellules: [saisir(sig.excedentBrutDExploitation, `${eur(sig.valeurAjoutee)} − ${eur(sig.impotsEtTaxes)} − ${eur(sig.personnel)} = ${eur(sig.excedentBrutDExploitation)}`, "la valeur ajoutée moins les impôts et taxes et le personnel")],
      },
      /* 6 */ { libelle: "Dotations d'exploitation", cellules: [saisir(sig.dotations, `${eur(montantDe("6811"))} + ${eur(montantDe("6815"))} + ${eur(montantDe("6817"))} = ${eur(sig.dotations)}`, "les amortissements, la provision et la dépréciation")] },
      /* 7 */ { libelle: "Résultat d'exploitation", fort: true, totalDe: { plus: [5], moins: [6] }, cellules: [saisir(sig.resultatDExploitation, `${eur(sig.excedentBrutDExploitation)} − ${eur(sig.dotations)} = ${eur(sig.resultatDExploitation)}`, "l'excédent brut moins les dotations")] },
      /* 8 */ { libelle: "Produits financiers", cellules: [saisir(sig.produitsFinanciers, `les intérêts du compte à terme, ${eur(sig.produitsFinanciers)}`, "les produits des placements")] },
      /* 9 */ { libelle: "Charges financières", cellules: [saisir(sig.chargesFinancieres, `${eur(montantDe("6611"))} + ${eur(montantDe("665"))} = ${eur(sig.chargesFinancieres)}`, "les intérêts et les escomptes accordés")] },
      /* 10 */ { libelle: "Résultat financier", fort: true, totalDe: { plus: [8], moins: [9] }, cellules: [saisir(sig.resultatFinancier, `${eur(sig.produitsFinanciers)} − ${eur(sig.chargesFinancieres)} = ${eur(sig.resultatFinancier)}`, "les produits financiers moins les charges financières, en négatif s'il le faut")] },
      /* 11 */ { libelle: "Résultat courant avant impôt", fort: true, totalDe: { plus: [7, 10] }, cellules: [saisir(sig.resultatCourantAvantImpot, `${eur(sig.resultatDExploitation)} ${terme(sig.resultatFinancier)} = ${eur(sig.resultatCourantAvantImpot)}`, "le résultat d'exploitation plus le résultat financier")] },
      /* 12 */ { libelle: "Impôt sur les bénéfices", cellules: [{ valeur: sig.impot }] },
      /* 13 */ { libelle: "Résultat net", fort: true, totalDe: { plus: [11], moins: [12] }, cellules: [saisir(sig.resultatNet, `${eur(sig.resultatCourantAvantImpot)} − ${eur(sig.impot)} = ${eur(sig.resultatNet)}, celui du compte de résultat`, "le résultat courant moins l'impôt")] },
    ],
  };
}

/** La capacité d'autofinancement, par la méthode additive puis par la méthode soustractive. */
export function grilleDeLaCaf(): TableauACompleter {
  return {
    titre: "La capacité d'autofinancement, par les deux méthodes",
    colonnes: ["Montant"],
    lignes: [
      /* 0 */ { libelle: "Résultat net", cellules: [{ valeur: sig.resultatNet }] },
      /* 1 */ { libelle: "Dotations aux amortissements, dépréciations et provisions", cellules: [saisir(caf.dotations, `${eur(montantDe("6811"))} + ${eur(montantDe("6815"))} + ${eur(montantDe("6817"))} = ${eur(caf.dotations)}`, "les charges qui ne se décaissent pas")] },
      /* 2 */ { libelle: "Reprises et produits de cession", cellules: [{ valeur: caf.reprises }] },
      /* 3 */ { libelle: "CAF, méthode additive", fort: true, totalDe: { plus: [0, 1], moins: [2] }, cellules: [saisir(caf.additive, `${eur(sig.resultatNet)} + ${eur(caf.dotations)} = ${eur(caf.additive)}`, "le résultat, plus ce qui ne se décaisse pas")] },
      /* 4 */ { libelle: "Excédent brut d'exploitation", cellules: [saisir(sig.excedentBrutDExploitation, `celui de la cascade, ${eur(sig.excedentBrutDExploitation)}`, "le solde avant les dotations")] },
      /* 5 */ { libelle: "Produits financiers encaissables", cellules: [saisir(sig.produitsFinanciers, `les intérêts du compte à terme, ${eur(sig.produitsFinanciers)} : courus, ils seront encaissés`, "les produits financiers, sauf les reprises")] },
      /* 6 */ { libelle: "Charges financières décaissables", cellules: [saisir(sig.chargesFinancieres, `les intérêts et l'escompte, ${eur(sig.chargesFinancieres)}`, "les charges financières, sauf les dotations")] },
      /* 7 */ { libelle: "Impôt sur les bénéfices", cellules: [{ valeur: sig.impot }] },
      /* 8 */ {
        libelle: "CAF, méthode soustractive",
        fort: true,
        totalDe: { plus: [4, 5], moins: [6, 7] },
        cellules: [saisir(caf.soustractive, `${eur(sig.excedentBrutDExploitation)} + ${eur(sig.produitsFinanciers)} − ${eur(sig.chargesFinancieres)} − ${eur(sig.impot)} = ${eur(caf.soustractive)}`, "l'excédent brut, plus ce qui s'encaisse, moins ce qui se décaisse")],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

const autreConsommation = auCentime(sig.consommations + montantDe("665") + montantDe("6817"));

export const LES_SOLDES_POUR_LA_BANQUE: Bureau = {
  code: "les-soldes-pour-la-banque",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["soldes-intermediaires-de-gestion"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Au bureau : les soldes pour la banque",
  accroche: "La banque veut les soldes intermédiaires de gestion et la capacité d'autofinancement de NOVA. Partez des comptes, rangez-les, dressez la cascade, calculez la CAF deux fois, puis répondez à la banque.",
  objectifs: [
    "Ranger chaque compte de gestion dans son solde, pièges compris",
    "Dresser la cascade des soldes, de la production au résultat net",
    "Calculer la capacité d'autofinancement par les deux méthodes, et la retrouver deux fois",
    "Lire un taux de valeur ajoutée et la CAF face aux remboursements",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. Le premier exercice est clos ; la banque attend le dossier de la seconde ligne.`,
    "Sur votre poste, la pile : le courriel du président dessus, la lettre de la banque, le compte de résultat compte par compte, les notes de la clôture et l'avis du compte à terme. Ouvrez-les : rien ne vous dit où va chaque compte.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "les-comptes",
      type: "classement",
      titre: "Ranger les comptes",
      consigne: "Rangez chaque compte du compte de résultat dans le solde où il entre. Les notes de la clôture expliquent les comptes inhabituels.",
      pieces: ["compte-de-resultat", "notes"],
      categories: SOLDES,
      elements: COMPTES.map((compte) => ({ code: `c-${compte}`, libelle: `${compte} · ${LIBELLES[compte] ?? compte}`, montant: montantDe(compte), categorie: RANGEMENT[compte]!.solde, pourquoi: RANGEMENT[compte]!.pourquoi })),
      explication: [
        "Une charge se range selon ce qu'elle rémunère : les tiers pour les consommations, le travail pour le personnel, l'usure et les risques pour les dotations, les prêteurs pour le financier. Le 6031 au crédit diminue les consommations.",
      ],
    },
    {
      id: "la-cascade",
      type: "etat",
      titre: "Dresser la cascade des soldes",
      consigne: "Complétez la cascade, de la production au résultat net. Un solde négatif s'écrit en négatif ; une ligne sans objet vaut zéro.",
      pieces: ["compte-de-resultat", "notes"],
      grille: grilleDesSoldes(),
      reussite: "La cascade tombe sur le résultat net du compte de résultat.",
      explication: [
        `La valeur ajoutée, ${eur(sig.valeurAjoutee)}, rémunère le personnel à ${pct(partage.personnel)} ; l'excédent brut, ${eur(sig.excedentBrutDExploitation)}, ne dépend ni des dotations, ni du financement, ni de l'impôt.`,
      ],
    },
    {
      id: "la-caf",
      type: "etat",
      titre: "Calculer la CAF deux fois",
      consigne: "Calculez la capacité d'autofinancement par la méthode additive, puis par la méthode soustractive. Les deux tombent sur le même montant.",
      pieces: ["notes", "avis"],
      grille: grilleDeLaCaf(),
      reussite: "Les deux méthodes donnent la même capacité d'autofinancement.",
      explication: [
        `Les deux méthodes donnent ${eur(caf.additive)}. La dépréciation de ${sonora.client} et la provision baissent le résultat sans rien décaisser : elles reviennent dans la CAF.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre à la banque",
      consigne: "Répondez aux questions de la banque, chiffres à l'appui.",
      pieces: ["lettre"],
      questions: [
        {
          id: "le-taux",
          question: "Quel est le taux de valeur ajoutée de NOVA ?",
          options: [
            { texte: pct(tauxDeValeurAjoutee), juste: true, retour: `Oui : ${eur(sig.valeurAjoutee)} ÷ ${eur(sig.production)}. NOVA achète beaucoup de ce qu'elle assemble : sa valeur ajoutée est une petite part de sa production.` },
            { texte: `${pct(sig.excedentBrutDExploitation / sig.production)}, l'excédent brut sur la production`, juste: false, retour: "Non : c'est le taux de marge brute. Le taux de valeur ajoutée rapporte la valeur ajoutée à la production." },
            { texte: `${pct((sig.production - autreConsommation) / sig.production)}, l'escompte et la dépréciation comptés en consommations`, juste: false, retour: "Non : l'escompte est une charge financière, la dépréciation une dotation. Ni l'un ni l'autre ne vient des fournisseurs." },
            { texte: `${pct(sig.valeurAjoutee / k.compteDeResultat.totalProduits)}, la valeur ajoutée sur le total des produits`, juste: false, retour: "Non : le total des produits mêle les intérêts du placement à la production." },
          ],
        },
        {
          id: "les-remboursements",
          question: `Que représente la CAF face aux ${eur(annuiteDeCapital)} de capital à rembourser en N+1 ?`,
          options: [
            { texte: `${couvertureDesRemboursements.toLocaleString("fr-FR")} fois ce capital`, juste: true, retour: `Oui : ${eur(caf.additive)} ÷ ${eur(annuiteDeCapital)}. La CAF de l'année rembourserait l'emprunt plusieurs fois.` },
            {
              texte: `${(Math.round((sig.resultatNet / annuiteDeCapital) * 100) / 100).toLocaleString("fr-FR")} fois, le résultat net rapporté au capital`,
              juste: false,
              retour: "Non : le résultat net oublie les dotations, qui ne se décaissent pas. La banque regarde la CAF.",
            },
            { texte: `${(Math.round((sig.excedentBrutDExploitation / annuiteDeCapital) * 100) / 100).toLocaleString("fr-FR")} fois, l'excédent brut rapporté au capital`, juste: false, retour: "Non : l'excédent brut est avant les intérêts et l'impôt, que NOVA paie avant de rembourser." },
          ],
        },
        {
          id: "la-depreciation",
          question: `La dépréciation de ${sonora.client} baisse-t-elle la capacité d'autofinancement ?`,
          options: [
            { texte: "Non, elle ne se décaisse pas", juste: true, retour: "Oui : elle baisse le résultat, puis revient dans la CAF. Elle la relève même un peu, par l'impôt qu'elle fait économiser." },
            { texte: "Oui, du montant de la dépréciation", juste: false, retour: "Non : la méthode additive la rajoute au résultat ; la méthode soustractive part de l'excédent brut, qu'elle ne touche pas." },
            { texte: `Oui, car la créance de ${sonora.client} ne sera sans doute jamais encaissée en entier`, juste: false, retour: "Non : la perte, si elle arrive, se constatera plus tard. La CAF de N mesure ce que l'activité de N laisse, avant toute perte réalisée." },
          ],
        },
      ],
      explication: [
        `Votre réponse à la banque : une valeur ajoutée de ${eur(sig.valeurAjoutee)}, soit ${pct(tauxDeValeurAjoutee)} de la production ; un résultat net de ${eur(sig.resultatNet)} ; une capacité d'autofinancement de ${eur(caf.additive)}, par les deux méthodes.`,
      ],
    },
  ],
};
