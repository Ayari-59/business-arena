import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_RECRUTEMENT, saisonnierOuInterim } from "../../monde/recrutement-de-l-escale";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RECRUTER ET INTÉGRER » : UN SAISONNIER OU UN INTÉRIMAIRE ? (Bac STMG,
 * ressources humaines et communication de terminale, palier 1).
 *
 * Le chapitre rangeait les formes de la relation de travail ; le cas chiffre, pour un poste de l'été, le
 * contrat saisonnier et l'intérim. Hypothèses : monde/recrutement-de-l-escale.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const coef = (x: number) => x.toLocaleString("fr-FR");

export const UN_SAISONNIER_OU_UN_INTERIMAIRE: Situation = {
  code: "un-saisonnier-ou-un-interimaire",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["recruter-et-integrer"],
  commanditaire: "La directrice",
  titre: "Un saisonnier ou un intérimaire ?",
  accroche: "Pour un poste de juillet et août, l'hôtel peut signer un contrat saisonnier ou appeler une agence d'intérim. Laquelle coûte moins, et quand l'autre se justifie-t-elle ?",
  objectifs: ["Chiffrer deux formes de la relation de travail", "Tenir compte du délai du recrutement", "Répondre à la directrice, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_RECRUTEMENT, pourquoi: "le cas reprend le coût d'un salarié de L'ESCALE et celui d'un recrutement." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice",
      texte: () => {
        const k = saisonnierOuInterim();
        return [
          `« Pour un poste aux étages, il me faut quelqu'un ${qte(k.mois)} mois. Un salarié nous coûte ${eur(k.mensuel)} par mois, charges et congés compris, et recruter un saisonnier coûte ${eur(k.recrutement)}. L'agence d'intérim facture ${coef(k.coefficient)} fois ce coût, sans recrutement à payer. Que choisir ? » La directrice`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de chaque solution, l'écart, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que coûte chaque solution",
      question: () => "Calculez le coût du contrat saisonnier, celui de l'intérim, puis l'écart.",
      champs: () => {
        const k = saisonnierOuInterim();
        return [
          { libelle: "Coût du contrat saisonnier", attendu: k.saisonnier, calcul: `${qte(k.mois)} × ${eur(k.mensuel)} + ${eur(k.recrutement)} = ${eur(k.saisonnier)}` },
          { libelle: "Coût de l'intérim", attendu: k.interim, calcul: `${qte(k.mois)} × ${eur(k.mensuel)} × ${coef(k.coefficient)} = ${eur(k.interim)}` },
          { libelle: "Écart", attendu: k.ecart, calcul: `${eur(k.interim)} − ${eur(k.saisonnier)} = ${eur(k.ecart)}` },
        ];
      },
      explication: () => [`Le contrat saisonnier coûte ${eur(saisonnierOuInterim().ecart)} de moins, recrutement compris.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      question: () => "Que répondez-vous à la directrice ?",
      options: () => {
        const k = saisonnierOuInterim();
        return [
          {
            texte: "Un contrat saisonnier, recruté dès le printemps ; l'intérim pour l'imprévu",
            juste: true,
            retour: `Oui : le contrat saisonnier coûte ${eur(k.ecart)} de moins, et le saisonnier peut revenir l'été suivant. Mais recruter prend du temps : pour un remplacement au pied levé, l'agence d'intérim, plus chère, fournit quelqu'un tout de suite.`,
          },
          {
            texte: "L'intérim : l'agence s'occupe de tout, l'hôtel n'a ni recrutement ni contrat à gérer, donc il paie moins",
            juste: false,
            retour: "Non : l'hôtel ne paie pas de recrutement, mais l'agence facture bien plus cher chaque mois. Sur toute la saison, l'intérim coûte davantage.",
          },
          {
            texte: "Un CDI : un emploi d'été doit toujours devenir un emploi durable",
            juste: false,
            retour: "Non : le besoin ne dure que la saison. Un CDI pour un besoin de 2 mois ne répond pas au besoin, et le contrat saisonnier existe pour cela.",
          },
        ];
      },
    },
  ],
};
