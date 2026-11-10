import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { CHARGES_DU_MOIS } from "../monde/maille-et-co";
import { COMMANDE_LA_PLUS_GROSSE, HYPOTHESES_DU_BUDGET, budgetDeMaille, finDeMarsAvecLaCommande } from "../monde/tresorerie-de-maille";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : PRÉVOIR SA TRÉSORERIE, LE BUDGET DE TRÉSORERIE (Bac STMG, sciences de gestion et numérique
 * de première, thème 4, question 1 : l'incidence des décisions sur la trésorerie, par la démarche
 * budgétaire).
 *
 * Le chapitre du BTS (« Budget de trésorerie », palier 4) fait le semestre de NOVA toutes taxes
 * comprises. Celui-ci est la version lycée : le premier trimestre de MAILLE & CO, hors taxes, trois mois.
 * Distinguer un encaissement d'une vente et un décaissement d'une charge (l'usure du rayonnage ne sort
 * pas de la caisse, la facture à 45 jours se paie le mois suivant), remplir le budget mois par mois (un
 * tableau à compléter), y lire le découvert de mars, chercher la plus grosse commande de printemps qui
 * l'évite (le curseur), puis l'éviter sans rien reporter (le laboratoire : payer le rayonnage en trois
 * fois). La démarche budgétaire ferme le chapitre : prévoir, comparer au réalisé, corriger.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez MAILLE & CO seule : janvier vient de la fiche de la
 * boutique ; février, mars, décembre et le rayonnage sont des hypothèses du cours, nommées dans
 * monde/tresorerie-de-maille.ts.
 */

export const ENTREPRISES_DU_BUDGET_DU_LYCEE = ["boutique"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

const donnee = (valeur: number) => ({ valeur });
const aSaisir = (valeur: number, calcul: string, indice?: string) => ({ valeur, saisir: true as const, calcul, ...(indice ? { indice } : {}) });

/** Le budget du trimestre, à compléter : les totaux et la trésorerie de chaque mois. */
export function grilleDuBudget(): TableauACompleter {
  const b = budgetDeMaille();
  const m = b.mois;
  return {
    titre: "Le budget de trésorerie du premier trimestre, hors taxes",
    colonnes: m.map((x) => x.nom),
    lignes: [
      {
        libelle: "Trésorerie au début du mois",
        cellules: m.map((x, i) => (i === 0 ? donnee(x.debut) : aSaisir(x.debut, `la trésorerie de fin ${i === 1 ? "de janvier" : "de février"} : ${eur(x.debut)}`, "la trésorerie de fin du mois d'avant"))),
      },
      { libelle: "Ventes encaissées en caisse", cellules: m.map((x) => donnee(x.caisse)) },
      { libelle: "Commandes des comités encaissées", cellules: m.map((x) => donnee(x.comites)) },
      { libelle: "Total des encaissements", fort: true, totalDe: { plus: [1, 2] }, cellules: m.map((x) => aSaisir(x.encaissements, `${eur(x.caisse)} + ${eur(x.comites)} = ${eur(x.encaissements)}`)) },
      { libelle: "Achats payés au façonnier", cellules: m.map((x) => donnee(x.achats)) },
      { libelle: "Loyer, publicité et entretien", cellules: m.map((x) => donnee(x.charges)) },
      { libelle: "Salaires et cotisations", cellules: m.map((x) => donnee(x.paie)) },
      { libelle: "Emballages et frais de carte", cellules: m.map((x) => donnee(x.autresCouts)) },
      { libelle: "Rayonnage neuf", cellules: m.map((x) => donnee(x.rayonnage)) },
      {
        libelle: "Total des décaissements",
        fort: true,
        totalDe: { plus: [4, 5, 6, 7, 8] },
        cellules: m.map((x) => aSaisir(x.decaissements, `${[x.achats, x.charges, x.paie, x.autresCouts, x.rayonnage].map(eur).join(" + ")} = ${eur(x.decaissements)}`)),
      },
      {
        libelle: "Trésorerie à la fin du mois",
        fort: true,
        totalDe: { plus: [0, 3], moins: [9] },
        cellules: m.map((x) => aSaisir(x.fin, `${eur(x.debut)} + ${eur(x.encaissements)} − ${eur(x.decaissements)} = ${eur(x.fin)}`, "le début du mois, plus ce qui entre, moins ce qui sort")),
      },
    ],
  };
}

export const PREVOIR_SA_TRESORERIE: Chapitre = {
  code: "prevoir-sa-tresorerie",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 4 · Temps et risque"],
  titre: "Prévoir sa trésorerie : le budget de trésorerie",
  accroche:
    "Une boutique qui gagne de l'argent peut manquer d'argent : les clients paient plus tard, la collection de printemps se paie d'un coup. Le budget de trésorerie, mois par mois, montre le découvert avant qu'il n'arrive.",
  objectifs: [
    "Distinguer un encaissement d'une vente, un décaissement d'une charge",
    "Construire un budget de trésorerie mois par mois",
    "Repérer un découvert à venir et choisir comment l'éviter",
    "Situer le budget dans la démarche budgétaire : prévoir, comparer, corriger",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_BUDGET_DU_LYCEE,
    pourquoi: "ce chapitre prévoit le premier trimestre de MAILLE & CO, dont le cours tient les ventes, les achats, les charges et la paie de janvier.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Gagner de l'argent, en manquer",
      notions: ["cash_budget"],
      texte: (c) => [
        `${c.entreprise} gagne de l'argent : ses ventes paient ses achats et ses charges. Mais l'argent n'entre pas le jour de la vente, ni ne sort le jour de l'achat. Les comités d'entreprise paient à 45 jours, le façonnier est payé à 45 jours, et la collection de printemps, livrée en février, se paie d'un coup en mars.`,
        "Le budget de trésorerie prévoit, mois par mois, ce qui entrera en caisse et ce qui en sortira. Il dit à l'avance si un mois sera à découvert, quand on peut encore réagir. C'est le dernier des budgets : il reprend ce que les autres prévoient.",
      ],
      repere: () => "Trésorerie de fin de mois = trésorerie du début + encaissements du mois − décaissements du mois.",
    },
    {
      id: "encaisser-ou-non",
      objectifs: [0],
      type: "tri",
      titre: "Ce qui entre et sort de la caisse",
      question: () => "Rangez chaque opération : fait-elle entrer de l'argent dans le mois, en faire sortir, ou ni l'un ni l'autre ?",
      categories: [
        { code: "encaissement", libelle: "Encaissement" },
        { code: "decaissement", libelle: "Décaissement" },
        { code: "aucun", libelle: "Ni l'un ni l'autre" },
      ],
      elements: () => [
        { libelle: "Les ventes de la journée, payées en caisse", montant: 0, categorie: "encaissement", pourquoi: "L'argent entre le jour même." },
        { libelle: "Le paiement de la paie de l'équipe", montant: 0, categorie: "decaissement", pourquoi: "L'argent sort à la fin du mois." },
        { libelle: "Le loyer du mois", montant: CHARGES_DU_MOIS.loyer, categorie: "decaissement", pourquoi: "Payé chaque mois au bailleur." },
        { libelle: "L'usure du rayonnage, amortie sur 48 mois", montant: CHARGES_DU_MOIS.amortissement, categorie: "aucun", pourquoi: "Une charge du compte de résultat, mais rien ne sort : le rayonnage a été payé à l'achat." },
        { libelle: "Une commande de comité livrée le 15, payable à 45 jours", montant: 0, categorie: "aucun", pourquoi: "Une vente du mois, mais l'argent arrivera le mois suivant : rien n'entre ce mois-ci." },
      ],
      relance: "Demandez-vous : de l'argent passe-t-il par la caisse ou la banque ce mois-ci ?",
      explication: () => [
        "Une vente n'est pas un encaissement, une charge n'est pas un décaissement : le compte de résultat les compte quand elles naissent, le budget de trésorerie quand l'argent bouge. L'amortissement n'y entre jamais.",
      ],
    },
    {
      id: "quand-payer",
      objectifs: [0],
      type: "choix",
      titre: "Quand se paie la livraison de janvier ?",
      question: () => {
        const j = budgetDeMaille().janvier;
        return `En janvier, le façonnier livre pour ${eur(j.achats)} d'articles, en moyenne le 15, payables à 45 jours. Dans quel mois du budget ce paiement sort-il ?`;
      },
      options: () => [
        { texte: "En février : 15 + 45, c'est la fin du mois suivant", juste: true, retour: "Oui : 15 + 45 = 60 jours de mois commerciaux, la fin de février. De même, ce que le façonnier a livré en décembre se paie en janvier." },
        { texte: "En janvier, le mois où les articles sont livrés et vendus", juste: false, retour: "Non : la livraison est un achat de janvier, mais le délai de paiement repousse le décaissement." },
        { texte: "En mars, au terme du trimestre, comme les autres factures", juste: false, retour: "Non : 45 jours après le 15 janvier, on est à la fin de février." },
      ],
    },
    {
      id: "le-budget",
      objectifs: [1],
      type: "a-completer",
      titre: "Le budget du trimestre",
      notions: ["cash_budget"],
      question: (c) => `Complétez le budget de trésorerie de ${c.entreprise} : les totaux de chaque mois, la trésorerie de fin de mois, et la trésorerie du début de février et de mars.`,
      grille: grilleDuBudget,
      explication: () => {
        const b = budgetDeMaille();
        const mars = b.mois[2]!;
        return [
          `Janvier et février laissent de la trésorerie ; mars finit à ${eur(mars.fin)}. Ce mois-là, la collection de printemps (${eur(mars.achats)}) et le rayonnage neuf (${eur(mars.rayonnage)}) sortent ensemble, quand les ventes ne sont pas encore celles du printemps.`,
        ];
      },
    },
    {
      id: "lire-le-budget",
      objectifs: [2],
      type: "choix",
      titre: "Ce que dit le budget",
      question: () => "Que fait la gérante de ce budget, établi en décembre ?",
      options: () => {
        const mars = budgetDeMaille().mois[2]!;
        return [
          { texte: `Elle prévient le découvert de ${eur(-mars.fin)} en mars`, juste: true, retour: "Oui : le budget sert à agir avant. Négocier un découvert autorisé, étaler un paiement, reporter un achat : chaque solution se choisit en décembre, pas le jour où la banque refuse un paiement." },
          { texte: "Rien : la boutique gagne de l'argent, la trésorerie suivra", juste: false, retour: "Non : gagner de l'argent sur le trimestre n'empêche pas un mois à découvert. Le décalage entre les ventes et les paiements suffit." },
          { texte: "Elle attend mars pour voir si les ventes sont meilleures que prévu", juste: false, retour: "Non : attendre, c'est découvrir le découvert quand il est là. Le budget est fait pour l'anticiper." },
        ];
      },
    },
    {
      id: "la-commande-de-printemps",
      objectifs: [2],
      type: "curseur",
      titre: "La plus grosse commande de printemps",
      notions: ["cash_budget"],
      sens: "plus-grande",
      question: () => {
        const mars = budgetDeMaille().mois[2]!;
        return `La commande de printemps, livrée en février, se paie en mars. Faites varier son montant : une droite donne ce dont mars dispose (la trésorerie du début et les encaissements, ${eur(mars.debut + mars.encaissements)}), l'autre ce qui sort en mars. Placez le curseur sur la plus grosse commande, à l'euro, que mars peut payer sans découvert, rayonnage payé comptant.`;
      },
      grandeur: () => ({ libelle: "Commande de printemps", unite: "€" }),
      cible: () => ({ attendu: COMMANDE_LA_PLUS_GROSSE, min: 50_000, max: HYPOTHESES_DU_BUDGET.fevrier.achats }),
      zones: ["Mars reste en positif", "Mars est à découvert"],
      rates: () => ({ dessous: "Mars peut payer une commande plus grosse : cherchez plus haut.", dessus: "À ce montant, mars finit à découvert." }),
      montrer: "Montrer la commande",
      lecture: (_c, commande) => {
        const mars = budgetDeMaille().mois[2]!;
        return [
          { libelle: "Ce dont mars dispose", montant: mars.debut + mars.encaissements },
          { libelle: "Ce qui sort en mars", montant: mars.decaissements - mars.achats + commande },
          { libelle: "Trésorerie à la fin de mars", montant: finDeMarsAvecLaCommande(commande), fort: true },
        ];
      },
      droites: () => {
        const mars = budgetDeMaille().mois[2]!;
        return { produit: () => mars.debut + mars.encaissements, cout: (commande) => mars.decaissements - mars.achats + commande, libelles: ["Ce dont mars dispose", "Ce qui sort en mars"] };
      },
      explication: () => [
        `Au-delà de ${eur(COMMANDE_LA_PLUS_GROSSE)}, mars passe à découvert. Commander moins éviterait le découvert, mais laisserait des rayons vides au printemps : la boutique perdrait des ventes. Il y a une autre voie.`,
      ],
    },
    {
      id: "eviter-le-decouvert",
      objectifs: [2],
      type: "simulation",
      titre: "Éviter le découvert sans rien reporter",
      notions: ["cash_budget"],
      question: () =>
        `Le fournisseur du rayonnage accepte d'être payé en ${qte(HYPOTHESES_DU_BUDGET.rayonnage.fois)} fois, à partir de mars. La gérante peut aussi reporter à avril une partie de la commande de printemps. Choisissez.`,
      leviers: () => [
        {
          code: "fois",
          libelle: "Paiement du rayonnage",
          unite: "",
          min: 1,
          max: HYPOTHESES_DU_BUDGET.rayonnage.fois,
          pas: 1,
          depart: 1,
          choix: [
            { valeur: 1, libelle: "Comptant, en mars" },
            { valeur: HYPOTHESES_DU_BUDGET.rayonnage.fois, libelle: `En ${qte(HYPOTHESES_DU_BUDGET.rayonnage.fois)} fois` },
          ],
        },
        { code: "report", libelle: "Commande reportée à avril", unite: "€", min: 0, max: 10_000, pas: 5_000, depart: 0 },
      ],
      lecture: (_c, p) => {
        const b = budgetDeMaille({ rayonnageEnFois: p.fois!, report: p.report! });
        const ref = budgetDeMaille();
        return [
          { libelle: "Trésorerie à la fin de mars", montant: b.mois[2]!.fin, reference: ref.mois[2]!.fin, fort: true },
          { libelle: "Rayonnage payé en mars", montant: b.mois[2]!.rayonnage, reference: ref.mois[2]!.rayonnage },
          { libelle: "Articles qui manqueront en rayon au printemps", montant: p.report!, reference: 0 },
        ];
      },
      defi: () => ({
        consigne: "Évitez tout découvert sans reporter d'achat : la collection doit être en rayon.",
        atteint: (p) => p.report === 0 && budgetDeMaille({ rayonnageEnFois: p.fois!, report: p.report! }).plusBas.fin >= 0,
        indice: (p) => {
          const b = budgetDeMaille({ rayonnageEnFois: p.fois!, report: p.report! });
          if (b.plusBas.fin < 0) return `Mars finit encore à ${eur(b.plusBas.fin)}.`;
          return `Plus de découvert, mais ${eur(p.report!)} d'articles manqueront au printemps.`;
        },
        solution: { fois: HYPOTHESES_DU_BUDGET.rayonnage.fois, report: 0 },
      }),
      explication: (_c, p) => {
        const b = budgetDeMaille({ rayonnageEnFois: p.fois! });
        return [
          `Défi relevé : en payant le rayonnage en ${qte(p.fois!)} fois, mars finit à ${eur(b.mois[2]!.fin)}, sans rien retirer des rayons. Le coût est reporté sur avril et mai : le budget du trimestre suivant devra le prévoir.`,
          "Étaler un paiement, négocier un délai, obtenir un découvert autorisé : toutes ces décisions changent le moment où l'argent sort, pas ce que la boutique gagne.",
        ];
      },
    },
    {
      id: "la-demarche-budgetaire",
      objectifs: [3],
      type: "choix",
      titre: "Prévoir, comparer, corriger",
      question: () => "Fin janvier, la caisse a encaissé 4 000 € de moins que le budget ne le prévoyait. Que demande la démarche budgétaire ?",
      options: () => [
        { texte: "Chercher la cause de l'écart et corriger la suite", juste: true, retour: "Oui : la démarche budgétaire prévoit (le budget), compare au réalisé (l'écart), puis corrige : la cause tient-elle à la météo, à un concurrent, au prix ? Les mois suivants se revoient avec ce qu'on a appris." },
        { texte: "Réécrire le budget de janvier pour qu'il colle au réalisé", juste: false, retour: "Non : le budget de janvier reste la référence. C'est l'écart entre les deux qui informe la gérante." },
        { texte: "Rien : un budget n'est qu'une estimation, les écarts sont normaux", juste: false, retour: "Non : un écart est normal, mais il se lit. Ignoré, il laisse le budget de mars faux." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const b = budgetDeMaille();
        return [
          `Le budget de ${c.entreprise} prévoit chaque mois ce qui entre et ce qui sort de la caisse, quand l'argent bouge et non quand la vente ou l'achat naît. Il montre, dès décembre, un découvert de ${eur(-b.mois[2]!.fin)} en mars, et laisse le temps de l'éviter en étalant le paiement du rayonnage.`,
          "La démarche budgétaire prévoit, compare au réalisé, et corrige. Dans l'arène, l'écran du budget de trésorerie fait la même prévision, tour après tour.",
        ];
      },
      repere: () => "Le budget de trésorerie : les encaissements et les décaissements prévus, mois par mois, pour voir venir un découvert et décider avant.",
    },
  ],
};
