import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { COMMERCES_A_STOCK, stockDuPointDeVente } from "../../chapitres/stock-du-point-de-vente";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE STOCK DU POINT DE VENTE » : ALLÉGER LE STOCK (BTS MCO,
 * palier 3).
 *
 * Le banquier trouve que trop d'argent dort en réserve. Il demande au commerçant ce que
 * libérerait un stock moyen plus léger, à ventes égales, et si le fournisseur financerait
 * alors le stock. L'élève refait seul les calculs du chapitre (stock moyen, coût d'achat
 * des marchandises vendues, rotation, durée de stockage), puis les refait pour le stock visé.
 *
 * Le cas est neuf par sa question : le chapitre lit le stock du trimestre et cherche, au
 * curseur, le stock final que le fournisseur finance ; ici, le banquier fixe un objectif de
 * réduction du stock moyen, et l'on en mesure l'effet sur la trésorerie et la rotation. Le
 * piège : un stock 20 % plus léger ne fait pas tourner le stock 20 % plus vite. Les chiffres
 * sont ceux du trimestre du chapitre (`stockDuPointDeVente`).
 */

/**
 * La réduction du stock moyen demandée par le banquier : un cinquième. C'est l'ordre de
 * grandeur d'un plan de réduction des stocks qu'un commerce tient en un an sans manquer de
 * ventes : moins de réassorts en avance, des fins de série soldées plus tôt.
 */
export const REDUCTION_DU_STOCK_MOYEN = 0.2;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auCentieme = (x: number) => Math.round(x * 100) / 100;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function allegerLeStock(c: Cas) {
  const st = stockDuPointDeVente(c);
  const stockVise = auCentime(st.stockMoyen * (1 - REDUCTION_DU_STOCK_MOYEN));
  const rotationVisee = auCentieme(st.camv / stockVise);
  const dureeVisee = Math.round(st.jours / rotationVisee);
  return {
    ...st,
    stockVise,
    tresorerieLiberee: auCentime(st.stockMoyen - stockVise),
    rotationVisee,
    dureeVisee,
    joursNonFinancesApres: Math.max(0, dureeVisee - st.delai),
    financeParLeFournisseur: dureeVisee <= st.delai,
    // Les erreurs classiques : la rotation qui monterait de 20 %, comme le stock baisse, ou
    // qui baisserait avec lui.
    rotationPlusVingt: auCentieme(st.rotation * (1 + REDUCTION_DU_STOCK_MOYEN)),
    rotationMoinsVingt: auCentieme(st.rotation * (1 - REDUCTION_DU_STOCK_MOYEN)),
  };
}

export const ALLEGER_LE_STOCK: Situation = {
  code: "alleger-le-stock",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["stock-du-point-de-vente"],
  commanditaire: "Le banquier",
  titre: "Alléger le stock",
  accroche:
    "Le banquier trouve que trop d'argent dort en réserve. Il veut savoir ce que libérerait un stock plus léger, et si le fournisseur financerait alors ce qui reste.",
  objectifs: [
    "Calculer le stock moyen, le coût d'achat des marchandises vendues et la rotation",
    "Calculer la trésorerie libérée par un stock moyen plus léger",
    "Calculer la nouvelle rotation et la nouvelle durée de stockage",
    "Comparer la durée de stockage au crédit du fournisseur, et répondre au banquier",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES_A_STOCK,
    pourquoi: "ce cas suit un stock de marchandises d'un trimestre à l'autre, et elle n'en garde pas.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du banquier",
      texte: (c) => {
        const r = allegerLeStock(c);
        return [
          `« Votre stock immobilise beaucoup d'argent. Si ${c.entreprise} réduisait son stock moyen de ${pct(REDUCTION_DU_STOCK_MOYEN * 100)} en vendant autant, combien de trésorerie libéreriez-vous ? Combien de temps un article resterait-il alors en réserve, et votre fournisseur, payé à ${qte(r.delai)} jours, financerait-il ce qui reste ? »`,
          `Pas de cours cette fois : vous avez le stock du trimestre ${r.s.trimestre}, valorisé au coût moyen pondéré de ${eur(r.s.cump)}, et la méthode est celle du chapitre. À vous de l'enchaîner.`,
        ];
      },
      tableau: (c) => {
        const r = allegerLeStock(c);
        return {
          titre: `${c.entreprise} · le stock du trimestre ${r.s.trimestre} (${qte(r.jours)} jours)`,
          colonnes: ["Quantité", "Valeur"],
          lignes: [
            { libelle: "Stock initial", valeurs: [qte(r.s.initial.quantite), eur(r.s.initial.valeur)] },
            { libelle: "Achats du trimestre", valeurs: [qte(r.s.achats.quantite), eur(r.s.achats.ht)] },
            { libelle: "Stock final", valeurs: [qte(r.s.final.quantite), eur(r.s.final.valeur)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la rotation et la durée de stockage d'aujourd'hui, la trésorerie libérée, la rotation et la durée avec le stock visé, ce que le fournisseur finance, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "Le stock aujourd'hui",
      notions: ["stock", "stock_rotation"],
      question: (c) => {
        const r = allegerLeStock(c);
        return `Calculez le stock moyen du trimestre, le coût d'achat des marchandises vendues, la rotation du stock (au centième), puis la durée moyenne de stockage sur ${qte(r.jours)} jours (au jour).`;
      },
      champs: (c) => {
        const r = allegerLeStock(c);
        return [
          { libelle: "Stock moyen", attendu: r.stockMoyen, calcul: `(${eur(r.s.initial.valeur)} + ${eur(r.s.final.valeur)}) ÷ 2 = ${eur(r.stockMoyen)}` },
          { libelle: "Coût d'achat des marchandises vendues", attendu: r.camv, calcul: `${eur(r.s.initial.valeur)} + ${eur(r.s.achats.ht)} − ${eur(r.s.final.valeur)} = ${eur(r.camv)}` },
          { libelle: "Rotation du stock", attendu: r.rotation, tolerance: 0.01, calcul: `${eur(r.camv)} ÷ ${eur(r.stockMoyen)} = ${deux(r.rotation)}` },
          { libelle: "Durée moyenne de stockage (jours)", attendu: r.duree, tolerance: 1, calcul: `${qte(r.jours)} ÷ ${deux(r.rotation)} = ${qte(r.duree)}` },
        ];
      },
      explication: (c) => {
        const r = allegerLeStock(c);
        return [`Aujourd'hui, ${eur(r.stockMoyen)} dorment en moyenne en réserve, et un article y reste ${qte(r.duree)} jours avant d'être vendu par ${c.entreprise}.`];
      },
    },
    {
      id: "le-stock-vise",
      type: "montants",
      titre: "Le stock visé",
      notions: ["stock_rotation", "bfr"],
      question: () =>
        `Avec un stock moyen réduit de ${pct(REDUCTION_DU_STOCK_MOYEN * 100)} et les mêmes ventes, calculez le stock moyen visé, la trésorerie libérée, la nouvelle rotation (au centième) et la nouvelle durée de stockage (au jour).`,
      champs: (c) => {
        const r = allegerLeStock(c);
        return [
          { libelle: "Stock moyen visé", attendu: r.stockVise, calcul: `${eur(r.stockMoyen)} × (1 − ${pct(REDUCTION_DU_STOCK_MOYEN * 100)}) = ${eur(r.stockVise)}` },
          { libelle: "Trésorerie libérée", attendu: r.tresorerieLiberee, calcul: `${eur(r.stockMoyen)} − ${eur(r.stockVise)} = ${eur(r.tresorerieLiberee)}` },
          { libelle: "Nouvelle rotation", attendu: r.rotationVisee, tolerance: 0.01, calcul: `${eur(r.camv)} ÷ ${eur(r.stockVise)} = ${deux(r.rotationVisee)}` },
          { libelle: "Nouvelle durée de stockage (jours)", attendu: r.dureeVisee, tolerance: 1, calcul: `${qte(r.jours)} ÷ ${deux(r.rotationVisee)} = ${qte(r.dureeVisee)}` },
        ];
      },
      explication: (c) => {
        const r = allegerLeStock(c);
        return [
          `Le coût des marchandises vendues ne bouge pas : seul le stock qui le porte maigrit. La rotation passe de ${deux(r.rotation)} à ${deux(r.rotationVisee)}, et ${eur(r.tresorerieLiberee)} reviennent dans la caisse de ${c.entreprise}, au lieu de dormir en réserve.`,
        ];
      },
    },
    {
      id: "le-fournisseur",
      type: "montants",
      titre: "Ce que le fournisseur finance",
      notions: ["payment_terms", "bfr"],
      question: (c) => {
        const r = allegerLeStock(c);
        return `Le fournisseur se paie à ${qte(r.delai)} jours. Pendant combien de jours un article est-il payé sans être encore vendu, aujourd'hui, puis avec le stock visé ? Comptez zéro si la durée de stockage ne dépasse pas le délai.`;
      },
      champs: (c) => {
        const r = allegerLeStock(c);
        const ecart = (d: number) => (d > r.delai ? `${qte(d)} − ${qte(r.delai)} = ${qte(d - r.delai)}` : `${qte(d)} jours ≤ ${qte(r.delai)} jours : aucun`);
        return [
          { libelle: "Jours non financés aujourd'hui", attendu: r.joursNonFinances, tolerance: 1, calcul: ecart(r.duree) },
          { libelle: "Jours non financés avec le stock visé", attendu: r.joursNonFinancesApres, tolerance: 1, calcul: ecart(r.dureeVisee) },
        ];
      },
      explication: (c) => {
        const r = allegerLeStock(c);
        return [
          r.financeParLeFournisseur
            ? `Avec le stock visé, un article serait vendu avant que le fournisseur ne soit payé : c'est lui qui financerait le stock de ${c.entreprise}.`
            : `Avec le stock visé, ${c.entreprise} porterait encore chaque article ${qte(r.joursNonFinancesApres)} jours avant de le vendre, au lieu de ${qte(r.joursNonFinances)} : l'écart se resserre, sans se fermer.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au banquier",
      question: () => "Quelle phrase envoyez-vous au banquier ?",
      options: (c) => {
        const r = allegerLeStock(c);
        const fin = r.financeParLeFournisseur ? "et le fournisseur financerait le stock" : `et ${qte(r.dureeVisee)} jours de stockage au lieu de ${qte(r.duree)}`;
        return [
          {
            texte: `${eur(r.tresorerieLiberee)} libérés, ${fin}`,
            juste: true,
            retour: `Oui : le stock moyen passerait à ${eur(r.stockVise)}, la rotation à ${deux(r.rotationVisee)} et la durée de stockage à ${qte(r.dureeVisee)} jours, contre ${qte(r.delai)} jours de crédit fournisseur. ${r.financeParLeFournisseur ? "Chaque article serait vendu avant d'être payé." : `Il resterait ${qte(r.joursNonFinancesApres)} jours à financer, au lieu de ${qte(r.joursNonFinances)}.`}`,
          },
          {
            texte: `La rotation monterait de ${pct(REDUCTION_DU_STOCK_MOYEN * 100)}, à ${deux(r.rotationPlusVingt)}, comme le stock baisse`,
            juste: false,
            retour: `Non : la rotation divise les ventes par le stock moyen. Un stock ${pct(REDUCTION_DU_STOCK_MOYEN * 100)} plus petit la multiplie par 1 ÷ ${(1 - REDUCTION_DU_STOCK_MOYEN).toLocaleString("fr-FR")}, et elle passe à ${deux(r.rotationVisee)}, pas à ${deux(r.rotationPlusVingt)}.`,
          },
          {
            texte: `La rotation tomberait à ${deux(r.rotationMoinsVingt)} : avec moins de stock, il tournerait moins`,
            juste: false,
            retour: `Non : à ventes égales, un stock plus petit tourne plus vite. La rotation monte à ${deux(r.rotationVisee)}, et chaque article reste ${qte(r.dureeVisee)} jours en réserve au lieu de ${qte(r.duree)}.`,
          },
        ];
      },
    },
  ],
};
