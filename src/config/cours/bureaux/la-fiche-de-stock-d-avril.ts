import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { auCentime } from "../monde/amortissement";
import { COMMANDE_DE_MAI, LETTRE_DE_HAUSSE, ficheDAvril } from "../monde/fiche-d-avril-de-pixel";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LA FICHE DE STOCK D'AVRIL (comptabilité générale, palier 3 ; la suite du chapitre « Les
 * stocks » et de son cas, « Le stock qui manque »).
 *
 * Début mai, chez PIXEL & CO : la banque veut une situation arrêtée à la fin d'avril. L'élève trie la
 * pile du mois (les factures, la lettre de hausse du fournisseur, le relevé des ventes, une commande de
 * mai), tient la fiche de stock au coût moyen de la période, passe les achats et les deux écritures
 * d'inventaire, puis répond au dirigeant, qui voudrait passer au premier entré, premier sorti. Tous les
 * chiffres se calculent dans le monde du cours (monde/fiche-d-avril-de-pixel.ts) ; ce fichier écrit la
 * pile, les consignes et les corrigés, qui ne partent jamais au navigateur.
 *
 * UN CRAN PLUS LOIN QUE LE CAS : les pièces du mois au lieu d'un récapitulatif, une hausse de prix en
 * cours de mois, une commande qui n'entre pas encore en stock, et la tentation de changer de méthode.
 */

const x = ficheDAvril();
const eur = (v: number) => montantEcrit(v + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const jour = (j: number) => `${j === 1 ? "1er" : j} ${x.mois}`;
const J = x.x.jours;
const FIN = jour(30);
const DEBUT = jour(1);

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du dirigeant",
  de: `Le dirigeant de ${x.entreprise}`,
  a: "La comptabilité",
  date: "2 mai",
  objet: "La situation d'avril pour la banque",
  paragraphes: [
    "Bonjour,",
    "La banque veut une situation arrêtée à la fin d'avril. Il me faut le stock au 30 avril, ce que nous ont coûté les articles vendus, et la marge du mois.",
    `Le fournisseur a augmenté ses prix en cours de mois. On m'a dit que le premier entré, premier sorti donnerait une meilleure marge : pourquoi ne pas l'adopter dès avril ?`,
    "Merci. Le dirigeant",
  ],
};

const FICHE: PieceDuBureau = {
  code: "fiche",
  nature: "fiche",
  titre: "Fiche de stock au 31 mars",
  de: `La comptabilité de ${x.entreprise}`,
  a: "La comptabilité",
  date: "31 mars",
  objet: "Articles de décoration, coût moyen pondéré de la période",
  paragraphes: [`Stock arrêté à l'inventaire du premier trimestre : ${qte(x.initial.quantite)} articles à ${eur(x.coutInitial)}.`],
  montants: [{ libelle: "Valeur du stock au 31 mars", montant: x.initial.valeur, fort: true }],
  mention: "La comptabilité tient les achats en charges et corrige le stock à chaque arrêté : l'inventaire intermittent.",
};

const facture = (code: string, j: number, l: typeof x.premiere): PieceDuBureau => ({
  code,
  nature: "facture",
  titre: `Facture de ${x.fournisseur} du ${jour(j)}`,
  de: x.fournisseur,
  a: x.entreprise,
  date: jour(j),
  objet: `Livraison du ${jour(j)}`,
  paragraphes: [`${qte(l.quantite)} articles de décoration à ${eur(l.prix)} hors taxes, livrés et reçus le ${jour(j)}.`],
  montants: [
    { libelle: "Total hors taxes", montant: l.ht },
    { libelle: `TVA à ${pct(x.tauxTva)}`, montant: l.tva },
    { libelle: "Total à payer", montant: l.ttc, fort: true },
  ],
});

const FACTURE_1 = facture("facture-1", J.livraison1, x.premiere);
const FACTURE_2 = facture("facture-2", J.livraison2, x.seconde);

const LETTRE: PieceDuBureau = {
  code: "lettre",
  nature: "lettre",
  titre: "Lettre du fournisseur",
  de: x.fournisseur,
  a: x.entreprise,
  date: jour(LETTRE_DE_HAUSSE.jour),
  objet: "Nos nouveaux tarifs",
  paragraphes: ["Madame, Monsieur,", `La hausse de nos coûts de transport nous oblige à relever nos prix de ${eur(x.hausse)} par article, pour toute livraison à partir du ${jour(LETTRE_DE_HAUSSE.aPartirDu)}.`],
};

const VENTES: PieceDuBureau = {
  code: "ventes",
  nature: "note",
  titre: "Relevé des ventes d'avril",
  de: "La place de marché et la boutique en ligne",
  a: x.entreprise,
  date: FIN,
  paragraphes: [
    `Ventes du ${DEBUT} au ${jour(J.ventes1)} : ${qte(x.serie)} articles.`,
    `Ventes du ${jour(J.ventes1 + 1)} au ${jour(J.ventes2)} : ${qte(x.serie)} articles.`,
    `Prix de vente moyen : ${eur(x.prixDeVente)} hors taxes.`,
  ],
  montants: [{ libelle: "Chiffre d'affaires du mois, hors taxes", montant: x.ventes, fort: true }],
  mention: "Les ventes sont déjà passées au journal, à leur date.",
};

const COMMANDE: PieceDuBureau = {
  code: "commande",
  nature: "bon",
  titre: `Bon de commande du ${jour(COMMANDE_DE_MAI.jour)}`,
  de: x.entreprise,
  a: x.fournisseur,
  date: jour(COMMANDE_DE_MAI.jour),
  paragraphes: [`${qte(x.premiere.quantite)} articles de décoration, livraison prévue le ${COMMANDE_DE_MAI.livraison} mai.`],
  mention: "Commande confirmée par le fournisseur.",
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, FICHE, FACTURE_1, LETTRE, FACTURE_2, VENTES, COMMANDE];

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE DE STOCK
// ─────────────────────────────────────────────────────────────────────────────

const UNITES = "articles";

/** La fiche de stock d'avril au coût moyen de la période : un tableau à compléter, corrigé au serveur. */
export function grilleDeLaFiche(): TableauACompleter {
  const saisir = (valeur: number, calcul: string, indice: string, plus: { unite?: string; horsTotal?: boolean } = {}) => ({ valeur, saisir: true, calcul, indice, ...plus });
  return {
    titre: `Fiche de stock ${/^[aeiou]/.test(x.mois) ? "d'" : "de "}${x.mois}, coût moyen de la période`,
    colonnes: ["Quantité", "Coût unitaire", "Montant"],
    lignes: [
      { libelle: `Stock au ${DEBUT}`, cellules: [{ valeur: x.initial.quantite, unite: UNITES }, { valeur: x.coutInitial, horsTotal: true }, { valeur: x.initial.valeur }] },
      {
        libelle: `Livraison du ${jour(J.livraison1)}`,
        cellules: [{ valeur: x.premiere.quantite, unite: UNITES }, { valeur: x.premiere.prix, horsTotal: true }, saisir(x.premiere.ht, `${qte(x.premiere.quantite)} × ${eur(x.premiere.prix)} = ${eur(x.premiere.ht)}`, "les unités livrées × leur prix")],
      },
      {
        libelle: `Livraison du ${jour(J.livraison2)}`,
        cellules: [{ valeur: x.seconde.quantite, unite: UNITES }, { valeur: x.seconde.prix, horsTotal: true }, saisir(x.seconde.ht, `${qte(x.seconde.quantite)} × ${eur(x.seconde.prix)} = ${eur(x.seconde.ht)}`, "les unités livrées × leur prix, après la hausse")],
      },
      {
        libelle: "Total disponible",
        fort: true,
        totalDe: { plus: [0, 1, 2] },
        cellules: [
          saisir(x.disponible.quantite, `${qte(x.initial.quantite)} + ${qte(x.premiere.quantite)} + ${qte(x.seconde.quantite)} = ${qte(x.disponible.quantite)}`, "le stock et les deux livraisons", { unite: UNITES }),
          saisir(x.coutMoyen, `${eur(x.disponible.valeur)} ÷ ${qte(x.disponible.quantite)} = ${eur(x.coutMoyen)}, au centime`, "la valeur disponible ÷ les unités disponibles", { horsTotal: true }),
          saisir(x.disponible.valeur, `${eur(x.initial.valeur)} + ${eur(x.premiere.ht)} + ${eur(x.seconde.ht)} = ${eur(x.disponible.valeur)}`, "le stock et les deux livraisons"),
        ],
      },
      { libelle: "Ventes du mois", cellules: [saisir(x.vendues, `${qte(x.serie)} + ${qte(x.serie)} = ${qte(x.vendues)}`, "les deux séries de ventes du relevé", { unite: UNITES }), { valeur: null }, { valeur: null }] },
      {
        libelle: `Stock au ${FIN}`,
        fort: true,
        totalDe: { plus: [3], moins: [4] },
        cellules: [
          saisir(x.final.quantite, `${qte(x.disponible.quantite)} − ${qte(x.vendues)} = ${qte(x.final.quantite)}`, "le disponible moins les ventes", { unite: UNITES }),
          { valeur: null },
          saisir(x.final.valeur, `${qte(x.final.quantite)} × ${eur(x.coutMoyen)} = ${eur(x.final.valeur)}`, "les unités restantes au coût moyen", { horsTotal: true }),
        ],
      },
      {
        libelle: "Coût d'achat des marchandises vendues",
        fort: true,
        cellules: [{ valeur: null }, { valeur: null }, saisir(x.coutDesVentes, `${eur(x.disponible.valeur)} − ${eur(x.final.valeur)} = ${eur(x.coutDesVentes)}`, "le disponible moins le stock final", { horsTotal: true })],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

const achat = (code: string, j: number, l: typeof x.premiere) => ({
  id: code,
  ecriture: {
    date: jour(j),
    libelle: `Facture de ${x.fournisseur}, livraison du ${jour(j)}`,
    lignes: [
      { role: "les achats de marchandises", compte: "607", sens: "debit" as const, montant: l.ht, indice: "le total hors taxes de la facture" },
      { role: "la TVA déductible", compte: "44566", sens: "debit" as const, montant: l.tva, indice: "la TVA de la facture" },
      { role: "la dette fournisseur", compte: "401", sens: "credit" as const, montant: l.ttc, indice: "le total de la facture, taxes comprises" },
    ],
  },
  indices: ["Des marchandises achetées pour être revendues : les achats de marchandises.", "La TVA se déduit ; le fournisseur attend le total."],
});

export const LA_FICHE_DE_STOCK_D_AVRIL: Bureau = {
  code: "la-fiche-de-stock-d-avril",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["les-stocks"],
  commanditaire: "Le dirigeant",
  entreprise: { code: x.c.code, nom: x.entreprise },
  titre: "Au bureau : la fiche de stock d'avril",
  accroche: "La banque veut une situation à fin avril, et le fournisseur a relevé ses prix en cours de mois. Triez la pile, tenez la fiche de stock, passez les écritures, puis répondez au dirigeant.",
  objectifs: [
    "Trier les pièces d'un mois : ce qui entre en stock, ce qui en sort, ce qui ne bouge pas encore",
    "Tenir une fiche de stock au coût moyen pondéré de la période, avec une hausse en cours de mois",
    "Passer les achats et les deux écritures d'inventaire de l'inventaire intermittent",
    "Calculer le coût d'achat des marchandises vendues et la marge, et défendre la permanence des méthodes",
  ],
  libre: false,
  accueil: [
    `Le 2 mai, au bureau de ${x.entreprise}. Le premier trimestre est arrêté ; avril vous attend.`,
    "Sur votre poste, le courriel du dirigeant et les pièces du mois. Ouvrez-les une à une : rien ne vous dit ce qu'il faut en faire.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "la-pile",
      type: "classement",
      titre: "Classer la pile",
      consigne: "Ouvrez chaque pièce et dites ce qu'elle fait au stock d'avril : une entrée, une sortie, une donnée pour le calcul, ou rien ce mois-ci.",
      pieces: ["courriel"],
      categories: [
        { code: "entree", libelle: "Une entrée en stock" },
        { code: "sortie", libelle: "Une sortie de stock" },
        { code: "donnee", libelle: "Une donnée pour le calcul" },
        { code: "rien", libelle: "Rien ce mois-ci" },
      ],
      elements: [
        { code: "fiche", piece: "fiche", libelle: FICHE.titre, categorie: "donnee", pourquoi: "Le stock final de mars est le stock initial d'avril : la fiche part de lui." },
        { code: "facture-1", piece: "facture-1", libelle: FACTURE_1.titre, categorie: "entree", pourquoi: "Des articles livrés et reçus : une entrée, à son prix d'achat hors taxes." },
        { code: "lettre", piece: "lettre", libelle: LETTRE.titre, categorie: "donnee", pourquoi: `La lettre explique le prix de la seconde livraison : ${eur(x.seconde.prix)} au lieu de ${eur(x.premiere.prix)}. Elle ne fait entrer ni sortir aucun article.` },
        { code: "facture-2", piece: "facture-2", libelle: FACTURE_2.titre, categorie: "entree", pourquoi: "Une seconde entrée, au nouveau prix : la fiche la prend pour ce qu'elle a coûté." },
        { code: "ventes", piece: "ventes", libelle: VENTES.titre, categorie: "sortie", pourquoi: "Les articles vendus sortent du stock : le relevé en donne les quantités." },
        { code: "commande", piece: "commande", libelle: COMMANDE.titre, categorie: "rien", pourquoi: "Une commande n'est pas une livraison : les articles entreront en stock en mai, le jour où ils arriveront." },
      ],
      explication: ["Deux entrées, une sortie, deux données, et une pièce qui attend mai. Le stock suit les marchandises, pas les papiers : une commande, même confirmée, n'y entre pas."],
    },
    {
      id: "la-fiche",
      type: "etat",
      titre: "Tenir la fiche de stock",
      consigne: "Complétez la fiche d'avril au coût moyen pondéré de la période, la méthode de l'entreprise : le coût moyen arrondi au centime, puis le stock final et le coût d'achat des marchandises vendues.",
      pieces: ["fiche", "facture-1", "facture-2", "ventes"],
      grille: grilleDeLaFiche(),
      explication: [
        `Le coût moyen du mois, ${eur(x.coutMoyen)}, mêle les articles à ${eur(x.premiere.prix)} et ceux à ${eur(x.seconde.prix)} : la hausse se partage entre ce qui est vendu et ce qui reste.`,
        `Au ${FIN}, le stock vaut ${eur(x.final.valeur)} ; les articles vendus ont coûté ${eur(x.coutDesVentes)}, le disponible moins le stock final.`,
      ],
    },
    {
      id: "les-ecritures",
      type: "journal",
      titre: "Passer les écritures",
      consigne: "Passez au journal les deux factures du mois, puis les deux écritures de l'inventaire du 30 avril, dans l'ordre que vous voulez.",
      pieces: ["facture-1", "facture-2"],
      ecritures: [
        achat("achat-1", J.livraison1, x.premiere),
        achat("achat-2", J.livraison2, x.seconde),
        {
          id: "annulation",
          ecriture: {
            date: FIN,
            libelle: "Annulation du stock initial",
            lignes: [
              { role: "la variation des stocks, en charge", compte: "6037", acceptes: ["603"], sens: "debit", montant: x.initial.valeur, indice: "la valeur du stock au 1er avril" },
              { role: "le stock initial qui sort du bilan", compte: "37", acceptes: ["370"], sens: "credit", montant: x.initial.valeur, indice: "la valeur du stock au 1er avril" },
            ],
          },
          indices: ["Le stock du début du mois sort du bilan : il est entré dans ce qui a pu se vendre.", "Au débit, la variation des stocks de marchandises ; au crédit, le stock."],
        },
        {
          id: "constatation",
          ecriture: {
            date: FIN,
            libelle: "Constatation du stock final",
            lignes: [
              { role: "le stock final qui entre au bilan", compte: "37", acceptes: ["370"], sens: "debit", montant: x.final.valeur, indice: "la valeur du stock au 30 avril, sur la fiche" },
              { role: "la variation des stocks, qui diminue la charge", compte: "6037", acceptes: ["603"], sens: "credit", montant: x.final.valeur, indice: "la valeur du stock au 30 avril, sur la fiche" },
            ],
          },
          indices: ["Le stock qui reste entre au bilan, à la valeur de la fiche.", "L'écriture inverse de l'annulation, pour le stock du 30 avril."],
        },
      ],
      explication: [
        `Les achats, ${eur(x.achats)}, et la variation des stocks, ${eur(x.variation)}, font ensemble ${eur(x.coutDesVentes)} : le coût d'achat des marchandises vendues de la fiche. Le stock augmente : la variation vient en moins des achats.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au dirigeant",
      consigne: "Répondez aux questions du courriel, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "le-stock",
          question: `Que vaut le stock au ${FIN} ?`,
          options: [
            { texte: eur(x.final.valeur), juste: true, retour: `Oui : ${qte(x.final.quantite)} articles au coût moyen du mois, ${eur(x.coutMoyen)}.` },
            { texte: `${eur(auCentime(x.final.quantite * x.coutInitial))}, au prix d'avant la hausse`, juste: false, retour: "Non : le coût moyen de la période mêle tous les articles disponibles, ceux d'après la hausse compris." },
            { texte: `${eur(auCentime(x.final.quantite * x.seconde.prix))}, au dernier prix payé`, juste: false, retour: "Non : ce serait un stock entièrement racheté au nouveau prix. La méthode de l'entreprise est le coût moyen de la période." },
            { texte: `${eur(x.initial.valeur)}, le stock du 1er avril`, juste: false, retour: "Non : le stock a bougé pendant le mois, deux livraisons et deux séries de ventes." },
          ],
        },
        {
          id: "la-marge",
          question: "Quelle est la marge commerciale d'avril ?",
          options: [
            { texte: eur(x.marge), juste: true, retour: `Oui : ${eur(x.ventes)} de ventes moins ${eur(x.coutDesVentes)} de coût d'achat des marchandises vendues.` },
            { texte: `${eur(auCentime(x.ventes - x.achats))}, les ventes moins les achats du mois`, juste: false, retour: "Non : les achats ne sont pas ce qui a été vendu. Le stock a augmenté : une part des achats attend dans la réserve." },
            { texte: `${eur(x.ventes)}, le chiffre d'affaires du mois`, juste: false, retour: "Non : le chiffre d'affaires n'est pas la marge. Il faut en retirer ce que les articles vendus ont coûté." },
            { texte: `${eur(auCentime(x.ventes - x.vendues * x.seconde.prix))}, au dernier prix payé`, juste: false, retour: "Non : les articles vendus ont coûté leur coût moyen du mois, pas le prix de la dernière livraison." },
          ],
        },
        {
          id: "la-methode",
          question: `En premier entré, premier sorti, la marge d'avril serait de ${eur(x.margePeps)}. Faut-il l'adopter dès avril ?`,
          options: [
            { texte: "Non : une méthode ne change pas pour un mois", juste: true, retour: `Oui : la permanence des méthodes interdit d'en changer sans raison ; sinon les mois ne se comparent plus. Et la marge n'est pas meilleure : en premier entré, premier sorti, la hausse attend dans le stock, ${eur(x.finalPeps)}, et pèsera plus tard.` },
            { texte: `Oui : ${eur(auCentime(x.margePeps - x.marge))} de marge en plus pour la banque, sans rien changer aux ventes`, juste: false, retour: "Non : aucune vente de plus, aucun achat de moins. La hausse n'a pas disparu, elle est dans le stock final." },
            { texte: "Oui, mais pour le stock final seulement, les ventes restant au coût moyen", juste: false, retour: "Non : une méthode vaut pour toute la fiche. Mêler deux méthodes ferait apparaître ou disparaître de la valeur." },
            { texte: "Non : le premier entré, premier sorti est interdit en France", juste: false, retour: "Non : le plan comptable l'admet, comme le coût moyen. C'est le changement sans raison qui ne l'est pas." },
          ],
        },
      ],
      explication: [`Votre réponse : le stock vaut ${eur(x.final.valeur)} au ${FIN}, les articles vendus ont coûté ${eur(x.coutDesVentes)}, la marge est de ${eur(x.marge)}, et la méthode reste le coût moyen de la période.`],
    },
  ],
};
