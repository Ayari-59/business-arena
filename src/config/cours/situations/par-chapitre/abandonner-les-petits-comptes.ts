import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { PORTEFEUILLES, portefeuilleABC } from "../../chapitres/portefeuille-abc";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PORTEFEUILLE CLIENTS : LA MÉTHODE ABC » : ABANDONNER LES
 * PETITS COMPTES ? (BTS NDRC, palier 4).
 *
 * Le directeur commercial veut cesser de servir les comptes de la classe C, et reporter le
 * temps gagné sur les comptes A, dont il espère davantage de ventes. L'élève refait seul
 * le chemin du chapitre : le classement en trois classes, ce que pèsent les comptes C en
 * chiffre d'affaires et en marge, ce que rapporterait la hausse espérée sur les A, puis
 * la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le chapitre disait qu'on ne laisse pas tomber les
 * comptes C ; le directeur demande de le chiffrer. Le portefeuille et ses classes sont
 * ceux du chapitre, lus par `portefeuilleABC`.
 */

/**
 * Ce que le directeur espère du temps rendu aux comptes A : 5 % de ventes en plus. C'est
 * l'effet qu'on prête d'ordinaire à une visite de plus par trimestre chez un gros client ;
 * le cas calcule aussi la hausse qu'il faudrait pour compenser la perte des comptes C.
 */
export const HAUSSE_ESPEREE_SUR_LES_A = 0.05;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const somme = (v: readonly number[]) => v.reduce((t, x) => t + x, 0);

/** Le portefeuille classé, et le bilan de l'abandon des comptes C. */
export function abandonDesComptesC(c: Cas) {
  const p = portefeuilleABC(c);
  const caC = somme(p.classes.C.map((k) => k.chiffreDAffaires));
  const margeC = somme(p.classes.C.map((k) => k.marge));
  const caA = somme(p.classes.A.map((k) => k.chiffreDAffaires));
  const margeA = somme(p.classes.A.map((k) => k.marge));
  // Des ventes en plus sur les comptes A, au même taux de marge : la marge monte d'autant.
  const gainSurLesA = auCentime(margeA * HAUSSE_ESPEREE_SUR_LES_A);
  return {
    p,
    hausse: HAUSSE_ESPEREE_SUR_LES_A * 100,
    caC,
    margeC,
    partDuCaC: auDixieme((caC / p.total) * 100),
    partDeLaMargeC: auDixieme((margeC / p.margeTotale) * 100),
    margeA,
    gainSurLesA,
    bilan: auCentime(gainSurLesA - margeC),
    hausseNecessaire: auDixieme((margeC / margeA) * 100),
    // L'erreur classique : compter la hausse en chiffre d'affaires, et la comparer à une marge.
    ventesEnPlusSurLesA: auCentime(caA * HAUSSE_ESPEREE_SUR_LES_A),
  };
}

export const ABANDONNER_LES_PETITS_COMPTES: Situation = {
  code: "abandonner-les-petits-comptes",
  parcours: "ndrc",
  palier: 4,
  blocs: [],
  reprend: ["portefeuille-abc"],
  commanditaire: "Le directeur commercial",
  titre: "Abandonner les petits comptes ?",
  accroche:
    "Le directeur commercial veut cesser de servir les comptes C pour se consacrer aux comptes A. Classer le portefeuille, chiffrer ce qu'on perdrait et ce qu'on espère, puis lui répondre.",
  objectifs: [
    "Classer un portefeuille en classes A, B et C",
    "Mesurer ce que pèse une classe en chiffre d'affaires et en marge",
    "Comparer la marge perdue à la marge espérée ailleurs",
    "Rédiger une réponse chiffrée au directeur commercial",
  ],
  libre: false,
  entreprises: {
    codes: PORTEFEUILLES,
    pourquoi: "ce cas classe un portefeuille d'au moins huit comptes, et seules les gammes les plus larges de l'arène en ont autant.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur commercial",
      texte: (c) => {
        const r = abandonDesComptesC(c);
        return [
          `« Nos plus petits comptes nous prennent du temps pour pas grand-chose. Je propose de ne plus servir ceux de la classe C, et de reporter ce temps sur les comptes A : j'en espère ${pct(r.hausse)} de ventes en plus. Faites le classement, et dites-moi si ${c.entreprise} y gagne. »`,
          "Pas de cours cette fois : vous avez les comptes du mois, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const { p } = abandonDesComptesC(c);
        return {
          titre: `Les comptes du mois, par chiffre d'affaires décroissant · ${c.entreprise}`,
          colonnes: ["Chiffre d'affaires", "Marge"],
          lignes: p.comptes.map((k) => ({ libelle: `${qte(k.rang)}. ${k.nom}`, valeurs: [eur(k.chiffreDAffaires), eur(k.marge)] })),
        };
      },
      repere: (c) => {
        const { p } = abandonDesComptesC(c);
        return `À rendre : le classement (A jusqu'à ${qte(p.seuils.a)} % du chiffre d'affaires cumulé, B jusqu'à ${qte(p.seuils.b)} %, C le reste), ce que pèsent les comptes C, ce que rapporterait la hausse sur les A, et votre réponse.`;
      },
    },
    {
      id: "classer",
      type: "tri",
      titre: "Les trois classes",
      notions: ["customer_portfolio"],
      question: (c) => {
        const { p } = abandonDesComptesC(c);
        return `Calculez les parts cumulées du chiffre d'affaires dans l'ordre du tableau, et rangez chaque compte dans sa classe : A jusqu'à ${qte(p.seuils.a)} %, B jusqu'à ${qte(p.seuils.b)} %, C au-delà.`;
      },
      categories: [
        { code: "A", libelle: "Classe A" },
        { code: "B", libelle: "Classe B" },
        { code: "C", libelle: "Classe C" },
      ],
      elements: (c) =>
        abandonDesComptesC(c).p.comptes.map((k) => ({
          libelle: k.nom,
          montant: k.chiffreDAffaires,
          categorie: k.classe,
          pourquoi: `Part cumulée jusqu'à ce compte : ${pct(k.cumul)}.`,
        })),
      explication: (c) => {
        const { p } = abandonDesComptesC(c);
        return [
          `${qte(p.classes.A.length)} comptes en A, ${qte(p.classes.B.length)} en B, ${qte(p.classes.C.length)} en C. Ce sont ces ${qte(p.classes.C.length)} derniers que le directeur propose de ne plus servir.`,
        ];
      },
    },
    {
      id: "poids-des-c",
      type: "montants",
      titre: "Ce que pèsent les comptes C",
      notions: ["customer_portfolio", "contribution_margin"],
      question: () =>
        "Calculez le chiffre d'affaires des comptes C et sa part dans le total, puis leur marge et sa part dans la marge totale, en pourcentage au dixième.",
      champs: (c) => {
        const r = abandonDesComptesC(c);
        const C = r.p.classes.C;
        return [
          { libelle: "Chiffre d'affaires des comptes C", attendu: r.caC, calcul: `${C.map((k) => eur(k.chiffreDAffaires)).join(" + ")} = ${eur(r.caC)}` },
          { libelle: "Part du chiffre d'affaires (%)", attendu: r.partDuCaC, tolerance: 0.2, calcul: `${eur(r.caC)} ÷ ${eur(r.p.total)} × 100 = ${pct(r.partDuCaC)}` },
          { libelle: "Marge des comptes C", attendu: r.margeC, calcul: `${C.map((k) => eur(k.marge)).join(" + ")} = ${eur(r.margeC)}` },
          { libelle: "Part de la marge (%)", attendu: r.partDeLaMargeC, tolerance: 0.2, calcul: `${eur(r.margeC)} ÷ ${eur(r.p.margeTotale)} × 100 = ${pct(r.partDeLaMargeC)}` },
        ];
      },
      explication: (c) => {
        const r = abandonDesComptesC(c);
        return [
          `Les comptes C font peu de chiffre d'affaires (${pct(r.partDuCaC)}), mais ils laissent ${eur(r.margeC)} de marge chaque mois. Les abandonner, c'est renoncer à cette somme : il faut la retrouver ailleurs.`,
        ];
      },
    },
    {
      id: "hausse-sur-les-a",
      type: "montants",
      titre: "Ce que rapporteraient les comptes A",
      notions: ["customer_portfolio", "contribution_margin"],
      question: (c) => {
        const r = abandonDesComptesC(c);
        return `Calculez la marge des comptes A, la marge en plus si leurs ventes montent de ${pct(r.hausse)} (au même taux de marge), le bilan de la proposition (marge en plus sur les A − marge perdue sur les C ; négatif s'il perd), puis la hausse des ventes des A qu'il faudrait pour compenser la perte, en pourcentage au dixième.`;
      },
      champs: (c) => {
        const r = abandonDesComptesC(c);
        return [
          { libelle: "Marge des comptes A", attendu: r.margeA, calcul: `${r.p.classes.A.map((k) => eur(k.marge)).join(" + ")} = ${eur(r.margeA)}` },
          { libelle: "Marge en plus sur les comptes A", attendu: r.gainSurLesA, tolerance: 0.5, calcul: `${eur(r.margeA)} × ${pct(r.hausse)} = ${eur(r.gainSurLesA)}` },
          { libelle: "Bilan de la proposition", attendu: r.bilan, tolerance: 0.5, calcul: `${eur(r.gainSurLesA)} − ${eur(r.margeC)} = ${eur(r.bilan)}` },
          { libelle: "Hausse nécessaire sur les comptes A (%)", attendu: r.hausseNecessaire, tolerance: 0.1, calcul: `${eur(r.margeC)} ÷ ${eur(r.margeA)} × 100 = ${pct(r.hausseNecessaire)}` },
        ];
      },
      explication: (c) => {
        const r = abandonDesComptesC(c);
        return [
          r.bilan < 0
            ? `La hausse espérée sur les A rapporterait ${eur(r.gainSurLesA)} de marge, quand les comptes C en laissent ${eur(r.margeC)} : ${c.entreprise} perdrait ${eur(-r.bilan)} par mois. Pour compenser, il faudrait ${pct(r.hausseNecessaire)} de ventes en plus sur les A, pas ${pct(r.hausse)}.`
            : `La hausse espérée sur les A rapporterait ${eur(r.gainSurLesA)} de marge, plus que les ${eur(r.margeC)} des comptes C : ${c.entreprise} y gagnerait ${eur(r.bilan)} par mois.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur commercial",
      question: () => "Quelle phrase envoyez-vous au directeur commercial ?",
      options: (c) => {
        const r = abandonDesComptesC(c);
        const garder = r.bilan < 0;
        return [
          {
            texte: garder
              ? `Garder les C : ${eur(r.margeC)} de marge, contre ${eur(r.gainSurLesA)} espérés sur les A`
              : `Abandonner les C : ${eur(r.gainSurLesA)} espérés sur les A, contre ${eur(r.margeC)}`,
            juste: true,
            retour: `Oui : ${garder ? "il faudrait" : "il suffirait de"} ${pct(r.hausseNecessaire)} de ventes en plus sur les comptes A pour retrouver la marge des comptes C ; le directeur en espère ${pct(r.hausse)}.${garder ? " Mieux vaut servir les comptes C à moindre coût, à distance, que les perdre." : ""}`,
          },
          {
            texte: `Les abandonner : les comptes C ne font que ${pct(r.partDuCaC)} de nos ventes`,
            juste: false,
            retour: `Non : une petite part du chiffre d'affaires n'est pas rien. Ces ${pct(r.partDuCaC)} laissent ${eur(r.margeC)} de marge par mois, qu'il faut comparer à ce qu'on espère gagner ailleurs : ${eur(r.gainSurLesA)}.`,
          },
          {
            texte: `Les abandonner : nous gagnerions ${eur(r.ventesEnPlusSurLesA)} sur les comptes A, à ${pct(r.hausse)} de plus`,
            juste: false,
            retour: `Non : ${eur(r.ventesEnPlusSurLesA)}, c'est du chiffre d'affaires ; il se compare à ce que les comptes C laissent en marge, pas à leurs ventes. En marge, la hausse sur les A rapporte ${eur(r.gainSurLesA)}, contre ${eur(r.margeC)} perdus sur les C.`,
          },
        ];
      },
    },
  ],
};
