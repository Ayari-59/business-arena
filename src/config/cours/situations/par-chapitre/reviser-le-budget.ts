import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_BUDGET, budgetDuPointDeVente } from "../../chapitres/budget-du-point-de-vente";
import { budgetDuTrimestre } from "../../monde/boutique";
import type { CodeDeReference } from "../../monde/maille-et-co";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE BUDGET DU POINT DE VENTE » : RÉVISER LE BUDGET (BTS MCO, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : la boutique MAILLE & CO, son budget du
 * trimestre 1 de N (monde/maille-et-co.ts) et le modèle du cours (monde/boutique.ts,
 * `budgetDuTrimestre`).
 *
 * Janvier est passé, sous l'objectif. La direction n'y croit plus : elle révise les ventes du trimestre
 * au rythme de janvier, sans toucher au stock voulu au 31 mars, et demande le budget révisé : les
 * ventes, les achats, la marge, ce que la caisse paiera, et de combien baisser les commandes. L'élève
 * refait seul les lignes du chapitre, cherche au curseur la baisse des commandes qui garde le stock
 * voulu, puis croise le budget révisé avec celui qu'on n'aurait pas révisé : le stock en trop et
 * l'argent qui dort.
 *
 * Le cas est neuf par sa question : le chapitre bâtit le budget sur la prévision ; ici, la prévision
 * baisse, et l'on cherche ce qui baisse avec elle. Le piège : la baisse des commandes se chiffre au prix
 * d'achat, pas au prix de vente, et elle ne touche que les articles vendus en moins.
 */

/**
 * LA RÉVISION DE LA DIRECTION, hypothèse du cours : les ventes du trimestre au rythme de janvier,
 * référence par référence, les 3 mois d'un trimestre pesant autant (convention du cours).
 */
export const MOIS_DANS_LE_TRIMESTRE = 3;

/** Les bornes du curseur des commandes : les achats retirés du budget, hors taxes, en euros. */
export const COMMANDES_DU_CURSEUR = { min: 0, max: 30_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function budgetRevise(c: Pick<Cas, "code">) {
  const x = budgetDuPointDeVente(c);
  const f = x.f;
  const auRythme = Object.fromEntries(f.gamme.map((r) => [r.code, MOIS_DANS_LE_TRIMESTRE * r.ventesDuMois])) as Record<CodeDeReference, number>;
  const r = budgetDuTrimestre(f, { ventesPrevues: auRythme });
  // Sans réviser : les ventes au rythme de janvier, mais les achats du budget de départ.
  const stockSansReviser = x.stockInitial + x.b.achats - r.ventes;
  const valeurSansReviser = auCentime(x.valeurInitiale + x.b.achatsHt - r.coutDAchatDesVendues);
  const enTrop = auCentime(valeurSansReviser - x.valeurFinale);
  return {
    x,
    r,
    auRythme,
    ecartDesVentes: auCentime(r.ventesHt - x.b.ventesHt),
    stockSansReviser,
    valeurSansReviser,
    /** Les achats hors taxes à retirer du budget pour garder le stock voulu : la réponse du curseur. */
    enTrop,
    articlesEnTrop: stockSansReviser - x.stockFinal,
    decaisseEnTrop: auCentime(x.b.decaisse - r.decaisse),
    partPayee: x.b.partPayee,
  };
}

export const REVISER_LE_BUDGET: Situation = {
  code: "reviser-le-budget",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["budget-du-point-de-vente"],
  commanditaire: "La direction",
  titre: "Réviser le budget du trimestre",
  accroche:
    "Janvier est passé, sous l'objectif. La direction révise les ventes du trimestre au rythme de janvier, et veut le budget révisé : ce qu'il faut acheter, la marge attendue, ce que la caisse paiera, et de combien baisser les commandes.",
  objectifs: [
    "Établir le budget des ventes révisé",
    "Recalculer les quantités à acheter quand les ventes prévues baissent, à stock voulu inchangé",
    "Calculer la marge commerciale budgétée et ce que les achats font sortir de la caisse",
    "Chiffrer le stock en trop si l'on ne révise pas, et répondre à la direction",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_BUDGET,
    pourquoi:
      "ce cas révise le budget de la boutique du cours, MAILLE & CO, dont la simulation tient le stock, les fournisseurs et la prévision des ventes ; le point de vente reste le même d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const { x } = budgetRevise(c);
        return [
          `« Janvier a fait ${eur(x.janvier)} pour un objectif de ${eur(x.b.objectifDuMois)}. Je n'attends pas le rattrapage : je révise les ventes du trimestre au rythme de janvier, référence par référence. Le stock voulu au 31 mars ne change pas. Je veux le budget révisé de ${x.f.entreprise} : les ventes, les achats, la marge, ce que la caisse paiera, et de combien je baisse mes commandes au façonnier. »`,
          `Pas de cours cette fois : vous avez le budget de départ et les ventes de janvier, et la méthode est celle du chapitre. Le façonnier est payé à ${x.faconnier.delaiDePaiement} jours, sur un trimestre de ${x.f.budget.jours} jours d'achats réguliers ; la TVA est de ${pct(x.tva * 100)}. Les 3 mois d'un trimestre pèsent autant.`,
        ];
      },
      tableau: (c) => {
        const { x } = budgetRevise(c);
        return {
          titre: `${x.f.entreprise} · le budget de départ et janvier`,
          colonnes: ["Ventes prévues au budget", "Ventes de janvier", "Stock au 1er janvier", "Stock voulu au 31 mars", "Prix de vente HT", "Prix d'achat HT"],
          lignes: x.b.references.map((r) => {
            const g = x.f.gamme.find((y) => y.code === r.code)!;
            return { libelle: r.nom, valeurs: [qte(r.ventes), qte(g.ventesDuMois), qte(r.stockInitial), qte(r.stockFinal), eur(r.prixHt), eur(r.coutDAchat)] };
          }),
        };
      },
      repere: () =>
        "À rendre : les ventes et les achats révisés, la marge, ce que la caisse paiera dans le trimestre, la baisse des commandes, ce que coûterait de ne pas réviser, et votre réponse.",
    },
    {
      id: "les-ventes-revisees",
      type: "montants",
      titre: "Les ventes révisées",
      notions: ["revenue"],
      question: () =>
        "Calculez les articles à vendre au rythme de janvier, les ventes hors taxes révisées, puis leur écart au budget de départ. Négatif pour un écart défavorable.",
      champs: (c) => {
        const { x, r, ecartDesVentes } = budgetRevise(c);
        return [
          { libelle: "Articles à vendre au rythme de janvier", attendu: r.ventes, calcul: `${MOIS_DANS_LE_TRIMESTRE} × (${x.f.gamme.map((g) => qte(g.ventesDuMois)).join(" + ")}) = ${qte(r.ventes)}` },
          { libelle: "Ventes hors taxes révisées", attendu: r.ventesHt, calcul: `${MOIS_DANS_LE_TRIMESTRE} × ${eur(x.janvier)} = ${eur(r.ventesHt)}` },
          { libelle: "Écart sur le budget des ventes", attendu: ecartDesVentes, calcul: `${eur(r.ventesHt)} − ${eur(x.b.ventesHt)} = ${eur(ecartDesVentes)}` },
        ];
      },
      explication: (c) => {
        const { x, r, ecartDesVentes } = budgetRevise(c);
        return [`Le trimestre révisé fait ${qte(r.ventes)} articles et ${eur(r.ventesHt)}, ${eur(-ecartDesVentes)} sous le budget de départ, ${qte(x.b.ventes - r.ventes)} articles de moins.`];
      },
    },
    {
      id: "les-achats-revises",
      type: "montants",
      titre: "Les achats révisés",
      notions: ["stock", "margin_rates"],
      question: () =>
        "Combien d'articles faut-il acheter pour servir ces ventes et finir avec le stock voulu ? Chiffrez ces achats hors taxes, puis la marge commerciale budgétée du trimestre révisé.",
      champs: (c) => {
        const { x, r } = budgetRevise(c);
        return [
          { libelle: "Articles à acheter", attendu: r.achats, calcul: `${qte(r.ventes)} + ${qte(x.stockFinal)} − ${qte(x.stockInitial)} = ${qte(r.achats)}` },
          { libelle: "Achats hors taxes", attendu: r.achatsHt, calcul: `${r.references.map((y) => `${qte(y.achats)} × ${qte(y.coutDAchat)}`).join(" + ")} = ${eur(r.achatsHt)}` },
          {
            libelle: "Marge commerciale budgétée",
            attendu: r.margeCommerciale,
            calcul: `${eur(r.ventesHt)} − (${eur(x.valeurInitiale)} + ${eur(r.achatsHt)} − ${eur(x.valeurFinale)}) = ${eur(r.margeCommerciale)}`,
          },
        ];
      },
      explication: (c) => {
        const { x, r } = budgetRevise(c);
        return [
          `Les ventes perdent ${qte(x.b.ventes - r.ventes)} articles, et les achats exactement autant : ${qte(r.achats)} au lieu de ${qte(x.b.achats)}. Les stocks de début et de fin ne bougent pas. La marge tombe à ${eur(r.margeCommerciale)}.`,
        ];
      },
    },
    {
      id: "ce-que-paiera-la-caisse",
      type: "montants",
      titre: "Ce que la caisse paiera",
      notions: ["payment_terms", "cash_budget"],
      question: () => "Calculez les achats révisés toutes taxes comprises, ce que la caisse en paie dans le trimestre, et ce qui restera dû au façonnier au 31 mars.",
      champs: (c) => {
        const { x, r } = budgetRevise(c);
        return [
          { libelle: "Achats toutes taxes comprises", attendu: r.achatsTtc, calcul: `${eur(r.achatsHt)} × ${qte(1 + x.tva)} = ${eur(r.achatsTtc)}` },
          { libelle: "Décaissé dans le trimestre", attendu: r.decaisse, calcul: `${eur(r.achatsTtc)} × (1 − ${x.faconnier.delaiDePaiement} ÷ ${x.f.budget.jours}) = ${eur(r.decaisse)}` },
          { libelle: "Dû au façonnier au 31 mars", attendu: r.detteFournisseur, calcul: `${eur(r.achatsTtc)} − ${eur(r.decaisse)} = ${eur(r.detteFournisseur)}` },
        ];
      },
      explication: (c) => {
        const { r } = budgetRevise(c);
        return [`Sur ${eur(r.achatsTtc)} d'achats, ${eur(r.decaisse)} sortiront de la caisse ce trimestre, et ${eur(r.detteFournisseur)} au trimestre suivant : le budget de trésorerie doit porter les deux.`];
      },
    },
    {
      id: "les-commandes-au-curseur",
      type: "curseur",
      titre: "Baissez les commandes",
      notions: ["stock", "cash_budget"],
      question: (c) => {
        const { x, valeurSansReviser } = budgetRevise(c);
        return `Si la boutique gardait les commandes du budget de départ (${eur(x.b.achatsHt)} hors taxes) et vendait au rythme de janvier, sa réserve vaudrait ${eur(valeurSansReviser)} au 31 mars. Faites baisser les commandes, en euros hors taxes, de 0 à ${eur(COMMANDES_DU_CURSEUR.max)} : une droite donne la valeur du stock au 31 mars, l'autre celle du stock voulu, ${eur(x.valeurFinale)}. Placez le curseur sur la plus grande baisse qui garde le stock voulu, puis validez.`;
      },
      grandeur: () => ({ libelle: "Commandes en moins, hors taxes", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: Math.floor(budgetRevise(c).enTrop + 1e-9), min: COMMANDES_DU_CURSEUR.min, max: COMMANDES_DU_CURSEUR.max }),
      zones: ["Le stock voulu est tenu", "Sous le stock voulu"],
      rates: () => ({
        dessous: "La réserve dépasse encore le stock voulu : vous pouvez baisser plus.",
        dessus: "À cette baisse, la réserve passe sous le stock voulu au 31 mars.",
      }),
      montrer: "Montrer la baisse",
      lecture: (c, k) => {
        const { x, valeurSansReviser, partPayee } = budgetRevise(c);
        const achats = auCentime(x.b.achatsHt - k);
        return [
          { libelle: "Achats du trimestre, hors taxes", montant: achats },
          { libelle: "Valeur du stock au 31 mars", montant: auCentime(valeurSansReviser - k) },
          { libelle: "Valeur du stock voulu", montant: x.valeurFinale },
          { libelle: "Décaissé dans le trimestre", montant: auCentime(achats * (1 + x.tva) * partPayee) },
          { libelle: "Stock en trop au 31 mars", montant: auCentime(valeurSansReviser - k - x.valeurFinale), fort: true },
        ];
      },
      droites: (c) => {
        const { x, valeurSansReviser } = budgetRevise(c);
        return { produit: (k) => valeurSansReviser - k, cout: () => x.valeurFinale, libelles: ["Valeur du stock au 31 mars", "Valeur du stock voulu"] };
      },
      explication: (c) => {
        const { x, enTrop, ecartDesVentes } = budgetRevise(c);
        return [
          `La boutique peut baisser ses commandes de ${eur(enTrop)} hors taxes, pas plus : c'est le prix d'achat des articles qu'elle ne vendra pas. Les ventes, elles, baissent de ${eur(-ecartDesVentes)} : une commande se réduit au prix d'achat, pas au prix de vente.`,
          `Au-delà, la réserve du 31 mars passerait sous les ${eur(x.valeurFinale)} voulus, et avril commencerait en manque.`,
        ];
      },
    },
    {
      id: "sans-reviser",
      type: "montants",
      titre: "Et sans réviser ?",
      notions: ["stock", "cash_budget"],
      question: () =>
        "Croisez les deux budgets. Si la direction gardait les commandes de départ et vendait au rythme de janvier : combien d'articles resteraient en réserve au 31 mars, combien de plus que le stock voulu, et combien la caisse aurait-elle payé de plus dans le trimestre ?",
      champs: (c) => {
        const { x, r, stockSansReviser, articlesEnTrop, decaisseEnTrop } = budgetRevise(c);
        return [
          { libelle: "Stock au 31 mars sans réviser", attendu: stockSansReviser, calcul: `${qte(x.stockInitial)} + ${qte(x.b.achats)} − ${qte(r.ventes)} = ${qte(stockSansReviser)}` },
          { libelle: "Articles en trop sur le stock voulu", attendu: articlesEnTrop, calcul: `${qte(stockSansReviser)} − ${qte(x.stockFinal)} = ${qte(articlesEnTrop)}` },
          { libelle: "Décaissé en trop dans le trimestre", attendu: decaisseEnTrop, calcul: `${eur(x.b.decaisse)} − ${eur(r.decaisse)} = ${eur(decaisseEnTrop)}` },
        ];
      },
      explication: (c) => {
        const { articlesEnTrop, enTrop, decaisseEnTrop } = budgetRevise(c);
        return [
          `Ne pas réviser, c'est garder ${qte(articlesEnTrop)} articles en trop, ${eur(enTrop)} au prix d'achat, dont ${eur(decaisseEnTrop)} payés dès le trimestre : de l'argent qui dort en réserve, et une dette fournisseur plus lourde au 31 mars.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const { x, r, enTrop, ecartDesVentes } = budgetRevise(c);
        return [
          {
            texte: `Commandons ${qte(r.achats)} articles : ${eur(enTrop)} hors taxes de moins`,
            juste: true,
            retour: `Oui : ${qte(r.ventes)} à vendre, plus ${qte(x.stockFinal)} à garder, moins ${qte(x.stockInitial)} déjà en réserve. La marge budgétée passe à ${eur(r.margeCommerciale)}, et la caisse paiera ${eur(r.decaisse)} dans le trimestre.`,
          },
          {
            texte: `Commandons ${eur(-ecartDesVentes)} hors taxes de moins, la baisse du chiffre d'affaires`,
            juste: false,
            retour: `Non : c'est réduire les commandes au prix de vente. Les ${qte(x.b.ventes - r.ventes)} articles vendus en moins s'achetaient ${eur(enTrop)} : baisser de ${eur(-ecartDesVentes)}, ce serait finir mars sous le stock voulu.`,
          },
          {
            texte: `Commandons ${qte(r.ventes)} articles, ce que nous vendrons au rythme de janvier`,
            juste: false,
            retour: `Non : on part avec ${qte(x.stockInitial)} articles et l'on veut en garder ${qte(x.stockFinal)}. Articles à acheter = ventes prévues + stock voulu − stock initial = ${qte(r.achats)}.`,
          },
          {
            texte: "Gardons nos commandes : le stock en trop servira en avril, sans rien coûter",
            juste: false,
            retour: `Non : le stock en trop est acheté et en partie payé dès le trimestre. Il immobilise ${eur(enTrop)} au prix d'achat, sans rien rapporter tant qu'il n'est pas vendu.`,
          },
        ];
      },
    },
  ],
};
