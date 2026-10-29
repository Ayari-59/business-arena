import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { LE_PANIER_MOYEN, ficheDe } from "../../chapitres/le-panier-moyen";
import { decembreFaceAJanvier, type BilanDeFinDAnnee } from "../../monde/vente-et-caisse";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PANIER MOYEN ET LA MARGE D'UNE VENTE » : LE PANIER DE FIN
 * D'ANNÉE (Bac pro MCV, palier 1).
 *
 * En décembre, la boutique vend beaucoup plus qu'en janvier. Le responsable des ventes demande si
 * une vente rapporte plus pour autant. L'élève refait les calculs du chapitre sur décembre (le
 * panier moyen, le coût et la marge d'une vente), les compare à janvier, et répond.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : janvier de MAILLE & CO (la fiche) et décembre de N − 1
 * (monde/vente-et-caisse.ts : le mois des cadeaux, 3 130 passages en caisse, 260 000 € hors taxes).
 * Le verdict se calcule : il suit la marge d'une vente, puis le panier. Un écart de moins de 1 %
 * ne compte pas (`SEUIL_DE_VARIATION`).
 *
 * CE QUI A CHANGÉ. Le cas comparait les trimestres 1 et 4 de l'arène chez quatre entreprises. Il
 * compare maintenant janvier (82,18 € de panier en caisse, 41,44 € de marge) et décembre (74,79 € et 38,43 €) :
 * le panier baisse, les clients prennent des articles moins chers à offrir.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const panierDeFinDAnnee = (c: Pick<Cas, "code">) => decembreFaceAJanvier(ficheDe(c));

function tableauDesDeuxMois(c: Cas): TableauDeDonnees {
  const { debut, fin } = panierDeFinDAnnee(c);
  return {
    titre: `${c.entreprise} · janvier et décembre`,
    colonnes: ["Janvier", "Décembre"],
    lignes: [
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(debut.chiffreDAffaires), eur(fin.chiffreDAffaires)] },
      { libelle: "Articles vendus", valeurs: [qte(debut.articles), qte(fin.articles)] },
      { libelle: "Passages en caisse", valeurs: [qte(debut.tickets), qte(fin.tickets)] },
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
  accroche: "En décembre, la boutique vend beaucoup plus. Mais une vente rapporte-t-elle plus ? Calculer le panier et la marge d'une vente, les comparer à janvier, et répondre.",
  objectifs: ["Calculer le panier moyen et la marge d'une vente d'un mois", "Comparer janvier et décembre, vente par vente", "Répondre au responsable avec les chiffres"],
  libre: false,
  entreprises: LE_PANIER_MOYEN.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du responsable",
      tableau: tableauDesDeuxMois,
      texte: (c) => {
        const { debut, fin } = panierDeFinDAnnee(c);
        return [
          `« En décembre, nous avons fait ${eur(fin.chiffreDAffaires)} de chiffre d'affaires, contre ${eur(debut.chiffreDAffaires)} en janvier. Mais une vente nous rapporte-t-elle plus qu'en janvier ? Faites le calcul, et dites-moi. »`,
          "Pas de cours cette fois. Les étiquettes n'ont pas changé d'un mois à l'autre.",
        ];
      },
      repere: () => "À rendre : le panier moyen et la marge d'une vente de décembre, leur écart avec janvier, et votre réponse.",
    },
    {
      id: "la-fin-d-annee",
      type: "montants",
      titre: "Une vente de décembre",
      notions: ["average_basket", "contribution_margin"],
      question: () => "Pour décembre, calculez le panier moyen, le coût d'une vente et la marge d'une vente, au centime.",
      champs: (c) => {
        const { fin: k } = panierDeFinDAnnee(c);
        return [
          { libelle: "Panier moyen", attendu: k.panier, calcul: `${eur(k.chiffreDAffaires)} ÷ ${qte(k.tickets)} = ${eur(k.panier)}` },
          { libelle: "Coût d'une vente", attendu: k.coutDUneVente, calcul: `${eur(k.coutDesVentes)} ÷ ${qte(k.tickets)} = ${eur(k.coutDUneVente)}` },
          { libelle: "Marge d'une vente", attendu: k.marge, calcul: `${eur(k.panier)} − ${eur(k.coutDUneVente)} = ${eur(k.marge)}` },
        ];
      },
      explication: (c) => {
        const { fin: k } = panierDeFinDAnnee(c);
        return [`En décembre, une vente laisse ${eur(k.panier)}, coûte ${eur(k.coutDUneVente)}, et rapporte ${eur(k.marge)} à ${c.entreprise}.`];
      },
    },
    {
      id: "les-ecarts",
      type: "montants",
      titre: "Janvier et décembre",
      notions: ["average_basket", "contribution_margin"],
      question: (c) => {
        const { debut } = panierDeFinDAnnee(c);
        return `En janvier, le panier moyen était de ${eur(debut.panier)} et la marge d'une vente de ${eur(debut.marge)}. Calculez l'écart du panier moyen, puis l'écart de la marge d'une vente, de janvier à décembre (négatif s'il baisse).`;
      },
      champs: (c) => {
        const p = panierDeFinDAnnee(c);
        return [
          { libelle: "Écart du panier moyen", attendu: p.ecartDuPanier, calcul: `${eur(p.fin.panier)} − ${eur(p.debut.panier)} = ${eur(p.ecartDuPanier)}` },
          { libelle: "Écart de la marge d'une vente", attendu: p.ecartDeLaMarge, calcul: `${eur(p.fin.marge)} − ${eur(p.debut.marge)} = ${eur(p.ecartDeLaMarge)}` },
        ];
      },
      explication: (c) => {
        const p = panierDeFinDAnnee(c);
        return [
          p.fin.tickets > p.debut.tickets
            ? `Le chiffre d'affaires a monté parce qu'il y a eu plus de ventes : ${qte(p.fin.tickets)} passages en caisse au lieu de ${qte(p.debut.tickets)}. Vente par vente, c'est une autre histoire.`
            : `Il y a eu ${qte(p.fin.tickets)} passages en caisse au lieu de ${qte(p.debut.tickets)}. Vente par vente, l'écart se lit dans le panier et dans la marge.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      question: () => "Une vente rapporte-t-elle plus en décembre qu'en janvier ?",
      options: (c) => {
        const p = panierDeFinDAnnee(c);
        const faits = `le panier passe de ${eur(p.debut.panier)} à ${eur(p.fin.panier)}, la marge d'une vente de ${eur(p.debut.marge)} à ${eur(p.fin.marge)}.`;
        const plus = p.fin.tickets > p.debut.tickets ? " La boutique gagne plus parce qu'elle vend plus, pas parce que chaque vente rapporte plus." : "";
        const reponse = (b: BilanDeFinDAnnee, oui: string) => (p.bilan === b ? `Oui : ${faits} ${oui}` : `Non : ${faits}`);
        return [
          { texte: "Oui : chaque vente rapporte plus qu'en janvier", juste: p.bilan === "rapporte-plus", retour: reponse("rapporte-plus", "Chaque vente laisse plus.") },
          { texte: "Autant : la marge d'une vente n'a presque pas bougé", juste: p.bilan === "pareil", retour: reponse("pareil", `Chaque vente rapporte autant.${plus}`) },
          { texte: "Non : le panier a baissé, et la marge avec lui", juste: p.bilan === "panier-baisse", retour: reponse("panier-baisse", `Les clients ont pris des articles moins chers, à offrir : chaque vente rapporte moins.${plus}`) },
          { texte: "Non : le panier tient, mais chaque vente coûte plus", juste: p.bilan === "cout-monte", retour: reponse("cout-monte", `Le coût d'une vente passe de ${eur(p.debut.coutDUneVente)} à ${eur(p.fin.coutDUneVente)}.${plus}`) },
        ];
      },
    },
  ],
};
