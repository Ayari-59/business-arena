import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { accord } from "../accords";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : TAUX DE MARQUE, TAUX DE MARGE, COEFFICIENT (BTS MCO, palier 2).
 *
 * Le calcul que le vendeur fait cent fois par jour : ce qu'il achète, ce qu'il revend, ce qui
 * reste entre les deux, et les trois façons de le dire (le taux de marque, le taux de marge,
 * le coefficient). Puis ce que devient la marge quand le prix d'achat change, et le prix de
 * vente qui garde le taux de marque du rayon.
 *
 * LA MARGE COMMERCIALE, PAS LA MARGE SUR COÛT VARIABLE. Le chapitre « Prix, coût et marge »
 * compare le prix à tout le coût variable d'une unité ; celui-ci le compare au seul prix
 * d'achat de ce qu'il faut acheter pour la vendre, comme le fait le commerce.
 *
 * Aucune hypothèse : le prix moyen et le prix d'achat sont ceux du mois du cas (`cas.ts`), le
 * prix d'achat étant celui du fournisseur de référence de l'arène ; les deux autres
 * fournisseurs, leurs écarts de prix et leurs délais de paiement sont ceux du scénario.
 */

const auDixieme = (x: number) => Math.round(x * 10) / 10;
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const coef = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qte = (n: number) => n.toLocaleString("fr-FR");
const auCentieme = (x: number) => Math.round(x * 100) / 100;

/** Les entreprises du cours qui achètent ce qu'elles vendent, ou ce qu'elles cuisinent. */
export const COMMERCES = ["boutique", "ecommerce", "bistrot"] as const;

/**
 * Les fournisseurs d'un scénario : le référent, le moins cher, le plus cher. Celui du cas
 * (`scenarioByCode(c.code)`, d'où vient son prix d'achat) ; une mission dans l'arène lit ceux
 * du scénario que son niveau fait jouer, qui peuvent porter d'autres noms.
 */
export function fournisseursDe(codeDuScenario: string) {
  const tous = scenarioByCode(codeDuScenario).scenario.suppliers ?? [];
  const parPrix = [...tous].sort((a, b) => a.costMultiplier - b.costMultiplier);
  const reference = tous.find((s) => s.costMultiplier === 1);
  if (!reference || parPrix.length < 3) throw new Error(`Pas de trois fournisseurs pour ${codeDuScenario}`);
  return { reference, moinsCher: parPrix[0]!, plusCher: parPrix[parPrix.length - 1]! };
}

export const fournisseursDuCas = (c: Cas) => fournisseursDe(c.code);

/** Les prix, la marge commerciale, ses taux et ses coefficients, pour un article puis pour le mois. */
export function tauxDeMarque(c: Cas) {
  const g = c.gestion;
  const f = fournisseursDuCas(c);
  const achat = g.matiereParUnite;
  const vente = g.prixMoyen;
  const marge = auCentime(vente - achat);
  const tMarque = auDixieme((marge / vente) * 100);
  const tMarge = auDixieme((marge / achat) * 100);
  const tauxTva = c.venteComptant.tauxTva;
  const venteTtc = auCentime(vente * (1 + tauxTva));
  // Le moins cher, au même prix de vente : le taux de marque monte.
  const achatMoinsCher = auCentime(achat * f.moinsCher.costMultiplier);
  const tMarqueMoinsCher = auDixieme(((vente - achatMoinsCher) / vente) * 100);
  // Le plus cher, au même taux de marque (celui que l'élève a calculé, au dixième).
  const achatPlusCher = auCentime(achat * f.plusCher.costMultiplier);
  const ventePlusCher = auCentime(achatPlusCher / (1 - tMarque / 100));
  return {
    fournisseurs: f,
    achat,
    vente,
    marge,
    quantite: g.quantite,
    margeDuMois: auCentime(marge * g.quantite),
    tMarque,
    tMarge,
    /** Le taux de marge retrouvé du seul taux de marque arrondi : t ÷ (1 − t). */
    tMargeDuTauxDeMarque: auDixieme((tMarque / (100 - tMarque)) * 100),
    tauxTva,
    venteTtc,
    coefHt: auCentieme(vente / achat),
    coefTtc: auCentieme(venteTtc / achat),
    achatMoinsCher,
    tMarqueMoinsCher,
    achatPlusCher,
    ventePlusCher,
    ventePlusCherTtc: auCentime(ventePlusCher * (1 + tauxTva)),
  };
}

export const TAUX_DE_MARQUE: Chapitre = {
  code: "taux-de-marque-et-coefficient",
  parcours: "mco",
  palier: 2,
  titre: "Taux de marque, taux de marge, coefficient",
  accroche:
    "Ce que le magasin achète, ce qu'il revend, ce qui reste entre les deux, et les trois façons de le dire. Puis le prix de vente qui garde la marge quand le fournisseur change.",
  objectifs: [
    "Calculer la marge commerciale d'un article et celle du mois",
    "Calculer le taux de marque et le taux de marge, et passer de l'un à l'autre",
    "Calculer le coefficient multiplicateur, hors taxes et toutes taxes comprises",
    "Mesurer l'effet d'un changement de fournisseur sur le taux de marque",
    "Fixer le prix de vente qui garde le taux de marque du rayon",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi:
      "le taux de marque se calcule sur ce que l'entreprise achète pour le revendre ou le cuisiner, et elle ne fait ni l'un ni l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Acheter, revendre",
      notions: ["margin_rates"],
      texte: (c) => {
        const m = tauxDeMarque(c);
        return [
          `Pour vendre ${accord(c, "un")} ${c.unite}, ${c.entreprise} achète ${eur(m.achat)} hors taxes à son fournisseur de référence, « ${m.fournisseurs.reference.name} ». Elle le vend en moyenne ${eur(m.vente)} hors taxes : c'est le prix de l'arène sur le premier trimestre.`,
          "Entre le prix de vente et le prix d'achat, il reste la marge commerciale. C'est elle que le commerçant surveille, produit par produit : elle doit payer le loyer, l'équipe, et laisser un bénéfice.",
        ];
      },
      repere: () => "Marge commerciale = prix de vente HT − prix d'achat HT. Elle se calcule toujours hors taxes.",
    },
    {
      id: "marge-commerciale",
      type: "montants",
      titre: "La marge commerciale",
      notions: ["margin_rates"],
      question: (c) => {
        const m = tauxDeMarque(c);
        return `${c.entreprise} achète ${eur(m.achat)} HT et vend ${eur(m.vente)} HT. En un mois, elle vend ${qte(m.quantite)} ${c.unites}. Calculez la marge commerciale d'${accord(c, "un")} ${c.unite}, puis celle du mois.`;
      },
      champs: (c) => {
        const m = tauxDeMarque(c);
        return [
          { libelle: "Marge commerciale unitaire", attendu: m.marge, calcul: `${eur(m.vente)} − ${eur(m.achat)} = ${eur(m.marge)}` },
          { libelle: "Marge commerciale du mois", attendu: m.margeDuMois, calcul: `${eur(m.marge)} × ${qte(m.quantite)} = ${eur(m.margeDuMois)}` },
        ];
      },
      explication: (c) => {
        const m = tauxDeMarque(c);
        return [`Chaque ${c.unite} ${accord(c, "vendu")} laisse ${eur(m.marge)} à ${c.entreprise} ; le mois, ${eur(m.margeDuMois)}. C'est avec cette somme qu'elle paie tout le reste.`];
      },
    },
    {
      id: "les-deux-taux",
      type: "montants",
      titre: "Taux de marque, taux de marge",
      notions: ["margin_rates"],
      question: (c) => {
        const m = tauxDeMarque(c);
        return `La marge de ${eur(m.marge)} se rapporte au prix de vente (le taux de marque) ou au prix d'achat (le taux de marge). Calculez les deux, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const m = tauxDeMarque(c);
        return [
          { libelle: "Taux de marque (%)", attendu: m.tMarque, calcul: `${eur(m.marge)} ÷ ${eur(m.vente)} × 100 = ${pct(m.tMarque)}`, tolerance: 0.1 },
          { libelle: "Taux de marge (%)", attendu: m.tMarge, calcul: `${eur(m.marge)} ÷ ${eur(m.achat)} × 100 = ${pct(m.tMarge)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const m = tauxDeMarque(c);
        return [
          `La même marge fait ${pct(m.tMarque)} du prix de vente et ${pct(m.tMarge)} du prix d'achat. Le taux de marque est toujours le plus petit des deux : il se rapporte au plus grand des deux prix.`,
        ];
      },
    },
    {
      id: "qui-a-raison",
      type: "choix",
      titre: "Deux chiffres pour une marge",
      notions: ["margin_rates"],
      question: (c) => {
        const m = tauxDeMarque(c);
        return `Au briefing, la responsable annonce : « on marge à ${pct(m.tMarque)} ». Un vendeur la reprend : « non, à ${pct(m.tMarge)} ». Qui a raison ?`;
      },
      options: (c) => {
        const m = tauxDeMarque(c);
        return [
          {
            texte: "Les deux : l'une parle du taux de marque, l'autre du taux de marge.",
            juste: true,
            retour: `Exactement. ${pct(m.tMarque)} se rapporte au prix de vente, ${pct(m.tMarge)} au prix d'achat. Dans un magasin, dites toujours de quel taux vous parlez : la grande distribution raisonne en taux de marque.`,
          },
          {
            texte: "La responsable : le taux de marge ne peut pas dépasser 100 %.",
            juste: false,
            retour: `Le taux de marge dépasse 100 % dès que la marge est plus grande que le prix d'achat. Ici, la marge (${eur(m.marge)}) se compare à ${eur(m.achat)}.`,
          },
          {
            texte: "Le vendeur : la marge se calcule toujours sur le prix d'achat.",
            juste: false,
            retour: `Elle se calcule sur l'un ou sur l'autre. Rapportée au prix de vente, c'est le taux de marque : ${pct(m.tMarque)}.`,
          },
        ];
      },
    },
    {
      id: "d-un-taux-a-l-autre",
      type: "montants",
      titre: "D'un taux à l'autre",
      notions: ["margin_rates"],
      question: (c) => {
        const m = tauxDeMarque(c);
        return `Le tableau de bord de ${c.entreprise} n'affiche que le taux de marque : ${pct(m.tMarque)}. Sans repartir des prix, retrouvez le taux de marge, au dixième. Pensez à la formule : taux de marge = taux de marque ÷ (100 − taux de marque) × 100.`;
      },
      champs: (c) => {
        const m = tauxDeMarque(c);
        return [
          {
            libelle: "Taux de marge (%)",
            attendu: m.tMargeDuTauxDeMarque,
            calcul: `${pct(m.tMarque)} ÷ (100 − ${pct(m.tMarque)}) × 100 = ${pct(m.tMargeDuTauxDeMarque)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const m = tauxDeMarque(c);
        return [
          `On retrouve le taux de marge calculé sur les prix, à l'arrondi près : ${pct(m.tMarge)}. Sur 100 € de ventes, ${pct(m.tMarque)} sont de la marge et le reste a payé les achats : c'est sur ce reste que se calcule le taux de marge.`,
        ];
      },
    },
    {
      id: "coefficient",
      type: "montants",
      titre: "Le coefficient multiplicateur",
      notions: ["markup_coefficient", "vat_payable"],
      question: (c) => {
        const m = tauxDeMarque(c);
        return `Le coefficient multiplicateur dit par combien multiplier le prix d'achat HT pour trouver le prix de vente. La TVA sur les ventes de ${c.entreprise} est de ${pct(m.tauxTva * 100)}. Calculez le coefficient hors taxes, le prix de vente TTC, puis le coefficient TTC, au centième.`;
      },
      champs: (c) => {
        const m = tauxDeMarque(c);
        return [
          { libelle: "Coefficient HT", attendu: m.coefHt, calcul: `${eur(m.vente)} ÷ ${eur(m.achat)} = ${coef(m.coefHt)}`, tolerance: 0.01 },
          {
            libelle: "Prix de vente TTC",
            attendu: m.venteTtc,
            calcul: `${eur(m.vente)} × ${coef(1 + m.tauxTva)} = ${eur(m.venteTtc)}`,
          },
          { libelle: "Coefficient TTC", attendu: m.coefTtc, calcul: `${eur(m.venteTtc)} ÷ ${eur(m.achat)} = ${coef(m.coefTtc)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const m = tauxDeMarque(c);
        return [
          `Multiplier ce qu'il faut acheter (${eur(m.achat)} HT) par ${coef(m.coefTtc)} donne directement le prix que voit le client : ${eur(m.venteTtc)} TTC. Le coefficient TTC mélange la marge et la TVA : la TVA n'est pas à ${c.entreprise}, elle la reverse à l'État.`,
        ];
      },
    },
    {
      id: "moins-cher",
      type: "montants",
      titre: "Un fournisseur moins cher",
      notions: ["margin_rates"],
      question: (c) => {
        const m = tauxDeMarque(c);
        const f = m.fournisseurs.moinsCher;
        return `Dans l'arène, un autre fournisseur, « ${f.name} », vend la même chose ${pct(Math.round((1 - f.costMultiplier) * 100))} moins cher. ${c.entreprise} garde son prix de vente de ${eur(m.vente)} HT. Calculez le nouveau prix d'achat, puis le nouveau taux de marque, au dixième.`;
      },
      champs: (c) => {
        const m = tauxDeMarque(c);
        const f = m.fournisseurs.moinsCher;
        return [
          {
            libelle: "Nouveau prix d'achat HT",
            attendu: m.achatMoinsCher,
            calcul: `${eur(m.achat)} × ${coef(f.costMultiplier)} = ${eur(m.achatMoinsCher)}`,
          },
          {
            libelle: "Nouveau taux de marque (%)",
            attendu: m.tMarqueMoinsCher,
            calcul: `(${eur(m.vente)} − ${eur(m.achatMoinsCher)}) ÷ ${eur(m.vente)} × 100 = ${pct(m.tMarqueMoinsCher)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const m = tauxDeMarque(c);
        return [`Le taux de marque passe de ${pct(m.tMarque)} à ${pct(m.tMarqueMoinsCher)}, sans toucher au prix de vente. C'est le premier levier du commerçant : acheter mieux.`];
      },
    },
    {
      id: "le-prix-du-plus-cher",
      type: "montants",
      titre: "Garder le taux de marque",
      notions: ["margin_rates", "markup_coefficient"],
      question: (c) => {
        const m = tauxDeMarque(c);
        const f = m.fournisseurs.plusCher;
        return `Le troisième fournisseur de l'arène, « ${f.name} », est ${pct(Math.round((f.costMultiplier - 1) * 100))} plus cher que le référent. ${c.entreprise} veut garder son taux de marque de ${pct(m.tMarque)}. Calculez le nouveau prix d'achat, puis le prix de vente HT qui garde ce taux : prix d'achat ÷ (1 − taux de marque).`;
      },
      champs: (c) => {
        const m = tauxDeMarque(c);
        const f = m.fournisseurs.plusCher;
        return [
          {
            libelle: "Nouveau prix d'achat HT",
            attendu: m.achatPlusCher,
            calcul: `${eur(m.achat)} × ${coef(f.costMultiplier)} = ${eur(m.achatPlusCher)}`,
          },
          {
            libelle: "Prix de vente HT",
            attendu: m.ventePlusCher,
            calcul: `${eur(m.achatPlusCher)} ÷ (1 − ${pct(m.tMarque)}) = ${eur(m.ventePlusCher)}`,
            // Le taux arrondi au dixième que l'élève a gardé déplace le prix de quelques centimes.
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const m = tauxDeMarque(c);
        return [
          `Pour garder ${pct(m.tMarque)} de marque, le prix de vente passe de ${eur(m.vente)} à ${eur(m.ventePlusCher)} HT, soit ${eur(m.ventePlusCherTtc)} TTC sur l'étiquette. Reste à savoir si le client suivra : c'est tout l'enjeu d'un fournisseur plus cher, qui doit apporter quelque chose que le client paie.`,
        ];
      },
    },
    {
      id: "le-vrai-prix",
      type: "choix",
      titre: "Ce que coûte le moins cher",
      notions: ["payment_terms", "margin_rates"],
      question: (c) => {
        const f = tauxDeMarque(c).fournisseurs;
        return `« ${f.moinsCher.name} » se paie à ${f.moinsCher.paymentDelayDays === 0 ? "la commande" : `${f.moinsCher.paymentDelayDays} jours`}, « ${f.reference.name} » à ${f.reference.paymentDelayDays} jours. Le taux de marque monte avec le moins cher : qu'est-ce qui pourrait pourtant faire hésiter ?`;
      },
      options: (c) => {
        const f = tauxDeMarque(c).fournisseurs;
        const ecart = f.reference.paymentDelayDays - f.moinsCher.paymentDelayDays;
        return [
          {
            texte: "Il faut payer plus tôt : la trésorerie avance l'argent plus longtemps.",
            juste: true,
            retour: `Oui. Avec le moins cher, ${c.entreprise} paie ${ecart} jours plus tôt : elle finance ses achats plus longtemps avant que les clients ne paient. Un meilleur taux de marque peut se payer en découvert.`,
          },
          {
            texte: "Rien : un taux de marque plus haut est toujours meilleur.",
            juste: false,
            retour: "Le taux de marque ne dit rien du moment où l'on paie, ni de la qualité que voit le client. Un commerçant compare aussi les délais et la fiabilité.",
          },
          {
            texte: "La TVA : elle est plus élevée chez un fournisseur moins cher.",
            juste: false,
            retour: "Le taux de TVA dépend de ce qui est vendu, pas du fournisseur. Et la TVA payée sur les achats se récupère.",
          },
        ];
      },
    },
  ],
};
