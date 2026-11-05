import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_COMMUNICATION, communicationDeLaBoutique } from "../../chapitres/communiquer-et-animer-en-local";
import { BUDGET_COUPE, meilleurPlan, planDeCommunication } from "../../monde/communication-locale";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « COMMUNIQUER ET ANIMER EN LOCAL » : MILLE EUROS POUR COMMUNIQUER (BTS MCO,
 * palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les supports du chapitre (monde/communication-locale.ts) et un
 * budget coupé de 1 500 € à 1 000 € (`BUDGET_COUPE`). Le plan du chapitre (la vitrine et 500 € de
 * publications) n'y tient plus. L'élève chiffre ce que laissent les plans possibles, trouve le meilleur
 * dans le nouveau budget, mesure ce que la coupe coûte vraiment à la marge, et répond. Le piège : croire
 * qu'une coupe de 500 € fait perdre 500 €, ou garder les publications, moins chères par contact, et
 * sacrifier la vitrine.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres de la réponse. */
export function milleEuros(c: Pick<Cas, "code">) {
  const x = communicationDeLaBoutique(c);
  const avant = x.meilleur;
  const apres = meilleurPlan(x.f, BUDGET_COUPE);
  const postsSeules = planDeCommunication(x.f, false, 500, BUDGET_COUPE);
  return { ...x, avant, apres, postsSeules, perte: auCentime(avant.laisse - apres.laisse), economie: avant.cout - apres.cout };
}

const tableauDesSupports = (c: Pick<Cas, "code">) => {
  const x = milleEuros(c);
  return {
    titre: "Les supports du mois, chiffrés",
    colonnes: ["Coût", "Ventes", "Laisse"],
    lignes: x.supports.map((s) => ({ libelle: s.nom, valeurs: [eur(s.cout), String(s.ventes), eur(s.laisse)] })),
  };
};

export const MILLE_EUROS_POUR_COMMUNIQUER: Situation = {
  code: "mille-euros-pour-communiquer",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["communiquer-et-animer-en-local"],
  commanditaire: "La direction",
  titre: "Mille euros pour communiquer",
  accroche: "La direction coupe le budget de communication du mois de 1 500 € à 1 000 €. Quel plan garder, et que coûte vraiment la coupe ?",
  objectifs: [
    "Chiffrer ce que laissent plusieurs plans de communication",
    "Trouver le meilleur plan dans un budget réduit",
    "Mesurer ce qu'une coupe de budget coûte à la marge, et répondre à la direction",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_COMMUNICATION, pourquoi: "ce cas reprend les supports du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      tableau: tableauDesSupports,
      texte: (c) => {
        const x = milleEuros(c);
        return [
          `« Nous devons économiser : le budget de communication du mois passe de ${eur(x.budget)} à ${eur(BUDGET_COUPE)}. Votre plan, la vitrine et ${eur(x.avant.budgetDesPosts)} de publications, n'y tient plus. Que gardez-vous, et combien la coupe va-t-elle nous coûter ? »`,
          "Pas de cours cette fois : vous avez ce que laisse chaque support, et la méthode est celle du chapitre. Les publications sponsorisées touchent 50 personnes par euro, jusqu'à 25 000.",
        ];
      },
      repere: () => "À rendre : ce que laissent les plans possibles dans le nouveau budget, le meilleur, ce que la coupe coûte à la marge, et votre réponse.",
    },
    {
      id: "les-plans",
      objectifs: [0],
      type: "montants",
      titre: "Ce que laissent les plans possibles",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      tableau: tableauDesSupports,
      question: () =>
        `Calculez ce que laisse, une fois payé, chacun de ces plans de ${eur(BUDGET_COUPE)} au plus : la vitrine seule ; ${eur(500)} de publications seules ; la vitrine et ${eur(100)} de publications.`,
      champs: (c) => {
        const x = milleEuros(c);
        const v = planDeCommunication(x.f, true, 0, BUDGET_COUPE);
        const p = x.postsSeules;
        const vp = planDeCommunication(x.f, true, 100, BUDGET_COUPE);
        return [
          { libelle: "La vitrine seule", attendu: v.laisse, calcul: `${eur(v.vitrine.marge)} − ${eur(v.vitrine.cout)} = ${eur(v.laisse)}` },
          { libelle: "Les publications seules", attendu: p.laisse, calcul: `${String(p.posts.ventes)} ventes : ${eur(p.posts.marge)} − ${eur(p.posts.cout)} = ${eur(p.laisse)}` },
          { libelle: "La vitrine et les publications", attendu: vp.laisse, calcul: `${eur(v.laisse)} + (${eur(vp.posts.marge)} − ${eur(vp.posts.cout)}) = ${eur(vp.laisse)}` },
        ];
      },
      explication: (c) => {
        const x = milleEuros(c);
        return [`Le meilleur plan dans ${eur(BUDGET_COUPE)} : la vitrine et ${eur(x.apres.budgetDesPosts)} de publications, qui laissent ${eur(x.apres.laisse)}. Garder les publications et sacrifier la vitrine ne laisserait que ${eur(x.postsSeules.laisse)}.`];
      },
    },
    {
      id: "ce-que-coute-la-coupe",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûte la coupe",
      notions: ["customer_acquisition_cost"],
      question: () => "Calculez l'économie de dépense entre le plan d'avant et le meilleur plan d'après, puis ce que la coupe fait perdre à ce que la communication laisse.",
      champs: (c) => {
        const x = milleEuros(c);
        return [
          { libelle: "Dépense économisée", attendu: x.economie, calcul: `${eur(x.avant.cout)} − ${eur(x.apres.cout)} = ${eur(x.economie)}` },
          { libelle: "Ce que la communication laisse en moins", attendu: x.perte, calcul: `${eur(x.avant.laisse)} − ${eur(x.apres.laisse)} = ${eur(x.perte)}` },
        ];
      },
      explication: (c) => {
        const x = milleEuros(c);
        return [`La boutique dépense ${eur(x.economie)} de moins, mais la marge des ventes perdues lui fait perdre plus : au bout du compte, la coupe lui coûte ${eur(x.perte)} par mois. Une dépense de communication rentable se coupe à perte.`];
      },
    },
    {
      id: "reponse",
      objectifs: [1, 2],
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const x = milleEuros(c);
        return [
          {
            texte: `Garder la vitrine et ${eur(x.apres.budgetDesPosts)} de publications`,
            juste: true,
            retour: `Oui : dans ${eur(BUDGET_COUPE)}, ce plan laisse ${eur(x.apres.laisse)}. La coupe économise ${eur(x.economie)} de dépense mais retire ${eur(x.perte)} à ce que la communication laisse : elle fait baisser le résultat. À dire à la direction avant qu'elle ne la confirme.`,
          },
          {
            texte: `Garder ${eur(500)} de publications : le coût par contact le plus bas`,
            juste: false,
            retour: `Ce plan ne laisse que ${eur(x.postsSeules.laisse)} : la vitrine, plus chère par contact, laisse bien plus.`,
          },
          {
            texte: `La coupe fait gagner ${eur(x.economie)} au résultat`,
            juste: false,
            retour: `Non : elle économise ${eur(x.economie)} de dépense, mais fait perdre plus de marge. Elle coûte ${eur(x.perte)} au résultat.`,
          },
        ];
      },
    },
  ],
};
