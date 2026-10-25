import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas, StockDuTrimestre } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE STOCK DU POINT DE VENTE (BTS MCO, palier 3).
 *
 * Ce que le stock immobilise, et à quelle vitesse il tourne : le stock moyen, le coût
 * d'achat des marchandises vendues, la rotation, la durée moyenne de stockage, la
 * couverture du stock final. Puis la question que le commerçant se pose avec son banquier :
 * le fournisseur finance-t-il le stock, ou le magasin paie-t-il ses articles avant de les
 * avoir vendus ? Le curseur cherche le plus gros stock final que le crédit fournisseur couvre.
 *
 * Aucune hypothèse : le trimestre est celui que l'arène joue avec un stock au début et à la
 * fin (`cas.stock`, valorisé au coût moyen pondéré), le délai de paiement du fournisseur est
 * celui du cas. Le curseur garde les ventes du trimestre : seul le stock de fin change.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auCentieme = (x: number) => Math.round(x * 100) / 100;

/** Les entreprises du cours qui gardent un stock de marchandises d'un trimestre à l'autre. */
export const COMMERCES_A_STOCK = ["boutique", "ecommerce"] as const;

const stockDe = (c: Cas): StockDuTrimestre => {
  if (!c.stock) throw new Error(`Pas de stock pour ${c.code}`);
  return c.stock;
};

/** Les chiffres du stock sur le trimestre, et le stock final que le crédit fournisseur finance. */
export function stockDuPointDeVente(c: Cas) {
  const s = stockDe(c);
  const jours = s.fin - s.debut + 1;
  const stockMoyen = auCentime((s.initial.valeur + s.final.valeur) / 2);
  const camv = s.coutDAchatDesVendues;
  const rotation = auCentieme(camv / stockMoyen);
  const duree = Math.round(jours / rotation);
  const venduesParJour = auCentieme(s.vendues / jours);
  const couverture = Math.round(s.final.quantite / venduesParJour);
  const delai = c.achat.delai;
  // Au même coût des vendues, la durée de stockage vaut le délai quand le stock moyen vaut
  // délai × coût des vendues ÷ jours : le stock final le plus gros qui le permet.
  const stockFinalFinance = Math.max(0, Math.floor(((2 * delai * camv) / jours - s.initial.valeur) / s.cump));
  return {
    s,
    jours,
    stockMoyen,
    camv,
    rotation,
    duree,
    venduesParJour,
    couverture,
    delai,
    joursNonFinances: Math.max(0, duree - delai),
    stockFinalFinance,
    /** La durée de stockage pour un stock final donné, au même coût des vendues. */
    dureePour: (quantiteFinale: number) => (jours * ((s.initial.valeur + quantiteFinale * s.cump) / 2)) / camv,
  };
}

const tableauDuTrimestre = (c: Cas) => {
  const s = stockDe(c);
  return {
    titre: `${c.entreprise} · le stock du trimestre ${s.trimestre}, au coût moyen pondéré de ${eur(s.cump)}`,
    colonnes: ["Quantité", "Valeur"],
    lignes: [
      { libelle: "Stock initial", valeurs: [qte(s.initial.quantite), eur(s.initial.valeur)] },
      { libelle: "Achats du trimestre", valeurs: [qte(s.achats.quantite), eur(s.achats.ht)] },
      { libelle: "Unités vendues", valeurs: [qte(s.vendues), "?"] },
      { libelle: "Stock final", valeurs: [qte(s.final.quantite), eur(s.final.valeur)] },
    ],
  };
};

export const STOCK_DU_POINT_DE_VENTE: Chapitre = {
  code: "stock-du-point-de-vente",
  parcours: "mco",
  palier: 3,
  blocs: [
    "BTS MCO Bloc 3 · Assurer la gestion opérationnelle",
    "Bac pro MCV Bloc 4A · Animer et gérer l'espace commercial",
    "2de pro GATL 4 · Traiter les flux physiques en relation avec les données de gestion",
    "BUT TC · Piloter un espace de vente",
  ],
  titre: "Le stock du point de vente",
  accroche:
    "Ce que le stock immobilise, et à quelle vitesse il tourne. Puis la question du banquier : le fournisseur finance-t-il le stock, ou le magasin paie-t-il ses articles avant de les vendre ?",
  objectifs: [
    "Calculer le stock moyen et le coût d'achat des marchandises vendues",
    "Calculer la rotation du stock et la durée moyenne de stockage",
    "Calculer la couverture du stock final, en jours de vente",
    "Comparer la durée de stockage au délai de paiement du fournisseur",
    "Trouver le stock final que le crédit fournisseur finance",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES_A_STOCK,
    pourquoi: "ce chapitre suit un stock de marchandises d'un trimestre à l'autre, et elle n'en garde pas.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qui dort en réserve",
      notions: ["stock", "weighted_average_cost"],
      texte: (c) => {
        const s = stockDe(c);
        const st = stockDuPointDeVente(c);
        return [
          `Au début du trimestre ${s.trimestre}, ${c.entreprise} a ${qte(s.initial.quantite)} unités en réserve. Elle en achète ${qte(s.achats.quantite)} et en vend ${qte(s.vendues)} en ${qte(st.jours)} jours. Le tableau donne les chiffres de l'arène, valorisés au coût moyen pondéré.`,
          "Un article en réserve, c'est de l'argent payé au fournisseur et pas encore revenu par la caisse. Le commerçant veut assez de stock pour ne pas manquer de ventes, et pas plus.",
        ];
      },
      repere: () => "Rotation = coût d'achat des marchandises vendues ÷ stock moyen. Durée de stockage = jours de la période ÷ rotation.",
      tableau: tableauDuTrimestre,
    },
    {
      id: "stock-moyen",
      type: "montants",
      titre: "Le stock moyen",
      notions: ["stock", "stock_rotation"],
      tableau: tableauDuTrimestre,
      question: () =>
        "Calculez le stock moyen du trimestre, en valeur : la moyenne du stock initial et du stock final. Puis le coût d'achat des marchandises vendues : stock initial, plus achats, moins stock final.",
      champs: (c) => {
        const st = stockDuPointDeVente(c);
        const s = st.s;
        return [
          { libelle: "Stock moyen", attendu: st.stockMoyen, calcul: `(${eur(s.initial.valeur)} + ${eur(s.final.valeur)}) ÷ 2 = ${eur(st.stockMoyen)}` },
          {
            libelle: "Coût d'achat des marchandises vendues",
            attendu: st.camv,
            calcul: `${eur(s.initial.valeur)} + ${eur(s.achats.ht)} − ${eur(s.final.valeur)} = ${eur(st.camv)}`,
          },
        ];
      },
      explication: (c) => {
        const st = stockDuPointDeVente(c);
        return [`En moyenne, ${eur(st.stockMoyen)} dorment en réserve pendant le trimestre, pour ${eur(st.camv)} de marchandises vendues au prix d'achat.`];
      },
    },
    {
      id: "rotation",
      type: "montants",
      titre: "La rotation et la durée de stockage",
      notions: ["stock_rotation"],
      question: (c) => {
        const st = stockDuPointDeVente(c);
        return `Le stock moyen vaut ${eur(st.stockMoyen)} et les marchandises vendues ${eur(st.camv)} au prix d'achat. Calculez la rotation du stock sur le trimestre (au centième), puis la durée moyenne de stockage sur ${qte(st.jours)} jours (au jour).`;
      },
      champs: (c) => {
        const st = stockDuPointDeVente(c);
        return [
          { libelle: "Rotation du stock", attendu: st.rotation, calcul: `${eur(st.camv)} ÷ ${eur(st.stockMoyen)} = ${deux(st.rotation)}`, tolerance: 0.01 },
          { libelle: "Durée moyenne de stockage (jours)", attendu: st.duree, calcul: `${qte(st.jours)} ÷ ${deux(st.rotation)} = ${qte(st.duree)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const st = stockDuPointDeVente(c);
        return [
          `Le stock a tourné ${deux(st.rotation)} fois dans le trimestre : un article reste en moyenne ${qte(st.duree)} jours en réserve avant d'être vendu.`,
        ];
      },
    },
    {
      id: "lire-la-rotation",
      type: "choix",
      titre: "Une rotation qui monte",
      notions: ["stock_rotation"],
      question: (c) => `Au trimestre suivant, la rotation du stock de ${c.entreprise} passe au-dessus de ${deux(stockDuPointDeVente(c).rotation)}. Qu'est-ce que cela veut dire ?`,
      options: () => [
        {
          texte: "Le stock tourne plus vite : moins d'argent dort en réserve pour les mêmes ventes.",
          juste: true,
          retour: "Oui. Une rotation plus forte, c'est une durée de stockage plus courte : le magasin vend la même chose avec moins de stock, donc moins d'argent avancé au fournisseur.",
        },
        {
          texte: "Le magasin a acheté plus de marchandises.",
          juste: false,
          retour: "Acheter plus sans vendre plus fait grossir le stock moyen : la rotation baisse.",
        },
        {
          texte: "Les ventes ont baissé.",
          juste: false,
          retour: "Moins de ventes, au même stock, c'est une rotation plus faible : le stock dort plus longtemps.",
        },
      ],
    },
    {
      id: "couverture",
      type: "montants",
      titre: "La couverture du stock final",
      notions: ["stock"],
      question: (c) => {
        const st = stockDuPointDeVente(c);
        return `À la fin du trimestre, il reste ${qte(st.s.final.quantite)} unités en réserve. Calculez les ventes moyennes par jour du trimestre (au centième), puis combien de jours ce stock final tiendra à ce rythme (au jour).`;
      },
      champs: (c) => {
        const st = stockDuPointDeVente(c);
        return [
          { libelle: "Ventes par jour", attendu: st.venduesParJour, calcul: `${qte(st.s.vendues)} ÷ ${qte(st.jours)} = ${deux(st.venduesParJour)}`, tolerance: 0.01 },
          { libelle: "Couverture (jours)", attendu: st.couverture, calcul: `${qte(st.s.final.quantite)} ÷ ${deux(st.venduesParJour)} = ${qte(st.couverture)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const st = stockDuPointDeVente(c);
        return [
          `Sans rien racheter, ${c.entreprise} peut vendre encore ${qte(st.couverture)} jours. C'est le chiffre qui dit quand recommander : la couverture doit dépasser le délai de livraison du fournisseur, sans le dépasser de beaucoup.`,
        ];
      },
    },
    {
      id: "qui-finance",
      type: "montants",
      titre: "Qui finance le stock ?",
      notions: ["payment_terms", "bfr"],
      question: (c) => {
        const st = stockDuPointDeVente(c);
        return `Le fournisseur de ${c.entreprise} se paie à ${qte(st.delai)} jours ; un article reste ${qte(st.duree)} jours en réserve. Pendant combien de jours, en moyenne, le magasin a-t-il payé un article sans l'avoir encore vendu ?`;
      },
      champs: (c) => {
        const st = stockDuPointDeVente(c);
        return [
          {
            libelle: "Jours non financés par le fournisseur",
            attendu: st.joursNonFinances,
            calcul: st.duree > st.delai ? `${qte(st.duree)} − ${qte(st.delai)} = ${qte(st.joursNonFinances)}` : `${qte(st.duree)} jours ≤ ${qte(st.delai)} jours : aucun`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const st = stockDuPointDeVente(c);
        return [
          st.duree > st.delai
            ? `Le fournisseur est payé au bout de ${qte(st.delai)} jours, mais l'article n'est vendu qu'au bout de ${qte(st.duree)} : pendant ${qte(st.joursNonFinances)} jours, c'est la trésorerie du magasin qui porte le stock. C'est une part du besoin en fonds de roulement.`
            : `L'article est vendu avant que le fournisseur ne soit payé : c'est le fournisseur qui finance le stock.`,
        ];
      },
    },
    {
      id: "stock-finance",
      type: "curseur",
      titre: "Le stock que le fournisseur finance",
      notions: ["stock_rotation", "payment_terms"],
      question: (c) => {
        const st = stockDuPointDeVente(c);
        return `Les ventes du trimestre ne changent pas. Faites varier le stock final, et placez le curseur sur le plus gros stock final, en unités, pour lequel la durée de stockage ne dépasse pas les ${qte(st.delai)} jours de crédit du fournisseur.`;
      },
      grandeur: () => ({ libelle: "Stock final", unite: "unités" }),
      sens: "plus-grande",
      cible: (c) => {
        const st = stockDuPointDeVente(c);
        return { attendu: st.stockFinalFinance, min: 0, max: Math.ceil(Math.max(st.s.final.quantite, st.stockFinalFinance) * 1.2) };
      },
      lecture: (c, quantite) => {
        const st = stockDuPointDeVente(c);
        return [
          { libelle: "Stock final, en valeur", montant: auCentime(quantite * st.s.cump) },
          { libelle: "Stock moyen", montant: auCentime((st.s.initial.valeur + quantite * st.s.cump) / 2) },
        ];
      },
      droites: (c) => {
        const st = stockDuPointDeVente(c);
        return { produit: () => st.delai, cout: (q) => st.dureePour(q), libelles: ["Délai du fournisseur (jours)", "Durée de stockage (jours)"] };
      },
      zones: ["Le fournisseur finance", "Le magasin avance l'argent"],
      rates: () => ({
        dessous: "Plus haut encore, le fournisseur finance toujours le stock : cherchez le plus gros.",
        dessus: "À ce niveau, un article reste en réserve plus longtemps que le crédit du fournisseur.",
      }),
      montrer: "Montrer le stock financé",
      explication: (c) => {
        const st = stockDuPointDeVente(c);
        return [
          `Avec ${qte(st.stockFinalFinance)} unités en fin de trimestre au lieu de ${qte(st.s.final.quantite)}, la durée de stockage retombe à ${qte(st.delai)} jours : chaque unité serait vendue avant d'être payée. Moins de stock, c'est aussi plus de risque de rupture : tout l'art du commerçant est entre les deux.`,
        ];
      },
    },
  ],
};
