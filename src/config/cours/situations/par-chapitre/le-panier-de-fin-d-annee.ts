import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ARTICLES_PAR_TICKET } from "../../../scenarios/sector-kpis";
import { accordPluriel } from "../../accords";
import type { Cas } from "../../cas";
import { LE_PANIER_MOYEN, TRIMESTRE_DU_PANIER, aUneGamme, venteDuTrimestre } from "../../chapitres/le-panier-moyen";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PANIER MOYEN ET LA MARGE D'UNE VENTE » : LE PANIER DE FIN
 * D'ANNÉE (Bac pro MCV, palier 1).
 *
 * Au dernier trimestre, l'entreprise vend beaucoup plus qu'en début d'année. Le responsable des
 * ventes demande si une vente rapporte plus pour autant. L'élève refait les calculs du chapitre
 * sur le trimestre 4 de l'arène (le panier moyen, le coût et la marge d'une vente), les compare
 * au trimestre 1 du chapitre, et répond.
 *
 * Les chiffres sont ceux du chapitre (`venteDuTrimestre`), sur l'année du cours ; seul change le
 * trimestre. Le verdict se calcule : il suit la marge d'une vente, puis le panier. Un écart de
 * moins de `SEUIL_DE_VARIATION` ne compte pas : c'est l'arrondi d'une division, pas un panier
 * qui bouge.
 */

/** Le trimestre de fin d'année : le quatrième, d'octobre à décembre. */
export const TRIMESTRE_DE_FIN_D_ANNEE = 4;

/** En dessous de 1 % d'écart, le panier ou la marge « n'a pas bougé » (hypothèse du cas). */
export const SEUIL_DE_VARIATION = 0.01;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export type BilanDeFinDAnnee = "rapporte-plus" | "pareil" | "panier-baisse" | "cout-monte";

/** Le début et la fin de l'année, côte à côte, et ce que la comparaison conclut. */
export function panierDeFinDAnnee(c: Cas) {
  const debut = venteDuTrimestre(c, TRIMESTRE_DU_PANIER);
  const fin = venteDuTrimestre(c, TRIMESTRE_DE_FIN_D_ANNEE);
  const ecartDuPanier = Math.round((fin.panier - debut.panier) * 100) / 100;
  const ecartDeLaMarge = Math.round((fin.marge - debut.marge) * 100) / 100;
  const bouge = (ecart: number, base: number) => Math.abs(ecart) > base * SEUIL_DE_VARIATION;
  const bilan: BilanDeFinDAnnee = !bouge(ecartDeLaMarge, debut.marge)
    ? "pareil"
    : ecartDeLaMarge > 0
      ? "rapporte-plus"
      : bouge(ecartDuPanier, debut.panier) && ecartDuPanier < 0
        ? "panier-baisse"
        : "cout-monte";
  return { debut, fin, ecartDuPanier, ecartDeLaMarge, bilan };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const { debut, fin } = panierDeFinDAnnee(c);
  return {
    titre: `${c.entreprise} · le début et la fin de l'année, dans l'arène`,
    colonnes: [`Trimestre ${debut.trimestre}`, `Trimestre ${fin.trimestre}`],
    lignes: [
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(debut.chiffreDAffaires), eur(fin.chiffreDAffaires)] },
      { libelle: `${majuscule(c.unites)} ${accordPluriel(c, "vendu")}`, valeurs: [qte(debut.unites), qte(fin.unites)] },
      { libelle: "Coût des ventes", valeurs: [eur(debut.coutDesVentes), eur(fin.coutDesVentes)] },
    ],
  };
}

export const LE_PANIER_DE_FIN_D_ANNEE: Situation = {
  code: "le-panier-de-fin-d-annee",
  parcours: "vente",
  palier: 1,
  blocs: [],
  reprend: [LE_PANIER_MOYEN.code],
  commanditaire: "Le responsable des ventes",
  titre: "Le panier de fin d'année",
  accroche:
    "En fin d'année, l'entreprise vend beaucoup plus. Mais une vente rapporte-t-elle plus ? Calculer le panier et la marge d'une vente, les comparer au début de l'année, et répondre.",
  objectifs: [
    "Calculer le panier moyen et la marge d'une vente d'un trimestre",
    "Comparer deux trimestres, vente par vente",
    "Répondre au responsable avec les chiffres",
  ],
  libre: false,
  entreprises: LE_PANIER_MOYEN.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du responsable",
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const { debut, fin } = panierDeFinDAnnee(c);
        return [
          `« En fin d'année, nous avons fait ${eur(fin.chiffreDAffaires)} de chiffre d'affaires, contre ${eur(debut.chiffreDAffaires)} au premier trimestre. Mais une vente nous rapporte-t-elle plus qu'en début d'année ? Faites le calcul, et dites-moi. »`,
          `Pas de cours cette fois. Les chiffres sont ceux de l'arène, aux trimestres ${qte(debut.trimestre)} et ${qte(fin.trimestre)}.`,
        ];
      },
      repere: () => "À rendre : le panier moyen et la marge d'une vente de fin d'année, leur écart avec le début d'année, et votre réponse.",
    },
    {
      id: "la-fin-d-annee",
      type: "montants",
      titre: "Une vente de fin d'année",
      notions: ["average_basket", "contribution_margin"],
      question: (c) => {
        const { fin } = panierDeFinDAnnee(c);
        return aUneGamme(c)
          ? `Pour le trimestre ${fin.trimestre}, calculez les passages en caisse (${qte(fin.unites)} articles ÷ ${qte(ARTICLES_PAR_TICKET)}, à l'unité), puis le panier moyen, le coût d'une vente et la marge d'une vente, au centime.`
          : `Pour le trimestre ${fin.trimestre}, calculez le panier moyen, le coût d'une vente et la marge d'une vente, au centime.`;
      },
      champs: (c) => {
        const { fin: k } = panierDeFinDAnnee(c);
        const tolerance = aUneGamme(c) ? 0.05 : 0.01;
        const champs = [
          { libelle: "Panier moyen", attendu: k.panier, calcul: `${eur(k.chiffreDAffaires)} ÷ ${qte(k.ventes)} = ${eur(k.panier)}`, tolerance },
          { libelle: "Coût d'une vente", attendu: k.coutDUneVente, calcul: `${eur(k.coutDesVentes)} ÷ ${qte(k.ventes)} = ${eur(k.coutDUneVente)}`, tolerance },
          { libelle: "Marge d'une vente", attendu: k.marge, calcul: `${eur(k.panier)} − ${eur(k.coutDUneVente)} = ${eur(k.marge)}`, tolerance },
        ];
        return aUneGamme(c)
          ? [{ libelle: "Passages en caisse", attendu: k.ventes, calcul: `${qte(k.unites)} ÷ ${qte(ARTICLES_PAR_TICKET)} = ${qte(k.ventes)}`, tolerance: 1 }, ...champs]
          : champs;
      },
      explication: (c) => {
        const { fin: k } = panierDeFinDAnnee(c);
        return [`En fin d'année, une vente laisse ${eur(k.panier)}, coûte ${eur(k.coutDUneVente)}, et rapporte ${eur(k.marge)} à ${c.entreprise}.`];
      },
    },
    {
      id: "les-ecarts",
      type: "montants",
      titre: "Le début et la fin de l'année",
      notions: ["average_basket", "contribution_margin"],
      question: (c) => {
        const { debut } = panierDeFinDAnnee(c);
        return `Au trimestre ${debut.trimestre}, le panier moyen était de ${eur(debut.panier)} et la marge d'une vente de ${eur(debut.marge)}. Calculez l'écart du panier moyen, puis l'écart de la marge d'une vente, entre le début et la fin de l'année (négatif s'il baisse).`;
      },
      champs: (c) => {
        const p = panierDeFinDAnnee(c);
        const tolerance = aUneGamme(c) ? 0.05 : 0.01;
        return [
          { libelle: "Écart du panier moyen", attendu: p.ecartDuPanier, calcul: `${eur(p.fin.panier)} − ${eur(p.debut.panier)} = ${eur(p.ecartDuPanier)}`, tolerance },
          { libelle: "Écart de la marge d'une vente", attendu: p.ecartDeLaMarge, calcul: `${eur(p.fin.marge)} − ${eur(p.debut.marge)} = ${eur(p.ecartDeLaMarge)}`, tolerance },
        ];
      },
      explication: (c) => {
        const p = panierDeFinDAnnee(c);
        return [
          p.fin.ventes > p.debut.ventes
            ? `Le chiffre d'affaires a monté parce qu'il y a eu plus de ventes : ${qte(p.fin.ventes)} ${p.fin.vente.pluriel} au lieu de ${qte(p.debut.ventes)}. Vente par vente, c'est une autre histoire.`
            : `Il y a eu ${qte(p.fin.ventes)} ${p.fin.vente.pluriel} au lieu de ${qte(p.debut.ventes)}. Vente par vente, l'écart se lit dans le panier et dans la marge.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      question: () => "Une vente rapporte-t-elle plus en fin d'année qu'en début d'année ?",
      options: (c) => {
        const p = panierDeFinDAnnee(c);
        const panier = p.ecartDuPanier === 0 ? `le panier reste à ${eur(p.fin.panier)}` : `le panier passe de ${eur(p.debut.panier)} à ${eur(p.fin.panier)}`;
        const faits = `${panier}, la marge d'une vente de ${eur(p.debut.marge)} à ${eur(p.fin.marge)}.`;
        const plus = p.fin.ventes > p.debut.ventes ? " L'entreprise gagne plus parce qu'elle vend plus, pas parce que chaque vente rapporte plus." : "";
        const cout = `Le coût d'une vente passe de ${eur(p.debut.coutDUneVente)} à ${eur(p.fin.coutDUneVente)}.`;
        const reponse = (b: BilanDeFinDAnnee, oui: string) => (p.bilan === b ? `Oui : ${faits} ${oui}` : `Non : ${faits}`);
        return [
          { texte: "Oui : chaque vente rapporte plus qu'en début d'année", juste: p.bilan === "rapporte-plus", retour: reponse("rapporte-plus", "Chaque vente laisse plus.") },
          { texte: "Autant : la marge d'une vente n'a presque pas bougé", juste: p.bilan === "pareil", retour: reponse("pareil", `Chaque vente rapporte autant.${plus}`) },
          { texte: "Non : le panier a baissé, et la marge avec lui", juste: p.bilan === "panier-baisse", retour: reponse("panier-baisse", `${aUneGamme(c) ? "Les clients ont pris des articles moins chers" : "Le prix a baissé"} : chaque vente rapporte moins.${plus}`) },
          { texte: "Non : le panier tient, mais chaque vente coûte plus", juste: p.bilan === "cout-monte", retour: reponse("cout-monte", `${cout}${plus}`) },
        ];
      },
    },
  ],
};
