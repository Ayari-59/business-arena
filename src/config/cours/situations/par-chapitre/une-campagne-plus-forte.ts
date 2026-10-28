import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { UN_NOUVEAU_CLIENT, bilanDeLaCampagne, ficheDe } from "../../chapitres/un-nouveau-client";
import { CAMPAGNE_DU_CHAPITRE, CAMPAGNE_PLUS_FORTE, campagne, passantsDeJanvier } from "../../monde/vente-et-caisse";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CE QUE RAPPORTE UN NOUVEAU CLIENT » : UNE CAMPAGNE PLUS FORTE
 * (Bac pro Métiers du commerce et de la vente, palier 2).
 *
 * Le responsable commercial veut refaire la campagne du chapitre, deux fois plus forte. L'élève
 * refait les calculs du chapitre (les ventes gagnées, le coût d'une vente gagnée, la marge, ce que
 * la campagne laisse), puis choisit entre la campagne plus forte, celle du chapitre et aucune.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les passants de MAILLE & CO en janvier et les offres de
 * l'agence (monde/vente-et-caisse.ts : 650 entrées en plus pour 4 000 €, 500 pour 2 000 €).
 * Le verdict se calcule : il suit ce que chaque campagne laisse une fois payée.
 *
 * CE QUI A CHANGÉ. Le cas rejouait dans l'arène une publicité triplée. Il compte maintenant l'offre
 * à 4 000 € : 123 ventes gagnées, 32,52 € par vente, une campagne qui coûte 41,86 € de plus qu'elle
 * ne rapporte, quand celle à 2 000 € laisse 1 057,10 €.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−");

export type ChoixDeLaCampagne = "plus-forte" | "celle-du-chapitre" | "aucune";

/** La campagne plus forte, celle du chapitre, et celle qui laisse le plus une fois payée. */
export function campagnePlusForte(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const forte = campagne(f, CAMPAGNE_PLUS_FORTE);
  const chapitre = campagne(f, CAMPAGNE_DU_CHAPITRE);
  const choix: ChoixDeLaCampagne = forte.laisse <= 0 && chapitre.laisse <= 0 ? "aucune" : forte.laisse > chapitre.laisse ? "plus-forte" : "celle-du-chapitre";
  return { forte, chapitre, passants: passantsDeJanvier(f), choix };
}

const lesDeux = (k: ReturnType<typeof campagnePlusForte>) => `La campagne à ${eur(k.chapitre.budget)} ${bilanDeLaCampagne(k.chapitre.laisse)} ; la campagne à ${eur(k.forte.budget)} ${bilanDeLaCampagne(k.forte.laisse)}.`;

export const UNE_CAMPAGNE_PLUS_FORTE: Situation = {
  code: "une-campagne-plus-forte",
  parcours: "vente",
  palier: 2,
  blocs: [],
  reprend: [UN_NOUVEAU_CLIENT.code],
  commanditaire: "Le responsable commercial",
  titre: "Une campagne plus forte",
  accroche: "Le responsable veut refaire la campagne, deux fois plus forte. Compter les ventes qu'elle gagne, ce que coûte chacune et ce qu'elle rapporte, et lui répondre.",
  objectifs: ["Compter les ventes gagnées par une campagne", "Calculer le coût et la marge d'une vente gagnée", "Choisir entre deux campagnes et aucune"],
  libre: false,
  entreprises: UN_NOUVEAU_CLIENT.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable",
      texte: (c) => {
        const k = campagnePlusForte(c);
        return [
          `« La campagne à ${eur(k.chapitre.budget)} a fait entrer ${qte(k.chapitre.entrees)} passants de plus. L'agence en promet ${qte(k.forte.entrees)} pour ${eur(k.forte.budget)}. Plus de publicité, plus de clients, non ? Dites-moi ce qu'il faut faire. »`,
          `Pas de cours cette fois. Les passants gagnés achètent comme ceux de janvier : ${qte(k.passants.tickets)} passages en caisse pour ${qte(k.passants.entrees)} entrées, ${eur(k.passants.margeDUneVente)} de marge par vente.`,
        ];
      },
      repere: () => "À rendre : les ventes gagnées, le coût et la marge d'une vente gagnée, et la campagne à faire.",
    },
    {
      id: "les-ventes",
      type: "montants",
      titre: "Les ventes de la campagne plus forte",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: (c) => `Calculez les ventes que gagnent les ${qte(campagnePlusForte(c).forte.entrees)} entrées de la campagne plus forte (au taux de transformation des passants, à l'unité), puis le coût d'une vente gagnée, au centime.`,
      champs: (c) => {
        const { forte: k, passants: p } = campagnePlusForte(c);
        return [
          { libelle: "Ventes gagnées", attendu: k.ventes, calcul: `${qte(k.entrees)} × ${qte(p.tickets)} ÷ ${qte(p.entrees)} = ${qte(k.ventes)}, à l'unité`, tolerance: 1 },
          { libelle: "Coût d'une vente gagnée", attendu: k.coutDUneVente, calcul: `${eur(k.budget)} ÷ ${qte(k.ventes)} = ${eur(k.coutDUneVente)}`, tolerance: 0.3 },
        ];
      },
      explication: (c) => {
        const k = campagnePlusForte(c);
        return [
          `Avec la campagne à ${eur(k.chapitre.budget)}, une vente gagnée coûtait ${eur(k.chapitre.coutDUneVente)} ; avec la campagne plus forte, ${eur(k.forte.coutDUneVente)}. ${
            k.forte.coutDUneVente > k.chapitre.coutDUneVente ? "Chaque euro de plus attire moins de clients que le précédent : la vente gagnée coûte plus cher." : "La vente gagnée ne coûte pas plus cher."
          }`,
        ];
      },
    },
    {
      id: "la-marge",
      type: "montants",
      titre: "La marge de la campagne plus forte",
      notions: ["contribution_margin"],
      question: () => "Calculez la marge des ventes gagnées, puis ce que la campagne plus forte laisse une fois payée (négatif si elle ne se paie pas).",
      champs: (c) => {
        const { forte: k, passants: p } = campagnePlusForte(c);
        return [
          { libelle: "Marge des ventes gagnées", attendu: k.marge, calcul: `${qte(k.ventes)} × ${eur(p.margeDUneVente)} = ${eur(k.marge)}`, tolerance: 33 },
          { libelle: "Ce que la campagne laisse", attendu: k.laisse, calcul: `${eur(k.marge)} − ${eur(k.budget)} = ${eur(k.laisse)}`, tolerance: 33 },
        ];
      },
      explication: (c) => [`La campagne plus forte ${bilanDeLaCampagne(campagnePlusForte(c).forte.laisse)}.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      notions: ["customer_acquisition_cost"],
      question: (c) => `${lesDeux(campagnePlusForte(c))} Quelle campagne conseillez-vous ?`,
      options: (c) => {
        const k = campagnePlusForte(c);
        const faits = lesDeux(k);
        return [
          { texte: "La campagne deux fois plus forte", juste: k.choix === "plus-forte", retour: k.choix === "plus-forte" ? `Oui. ${faits} Les ventes en plus paient la publicité en plus.` : `Non. ${faits}` },
          { texte: "Celle du chapitre, sans plus", juste: k.choix === "celle-du-chapitre", retour: k.choix === "celle-du-chapitre" ? `Oui. ${faits} Au-delà, les ventes en plus ne paient plus la publicité en plus.` : `Non. ${faits}` },
          { texte: "Aucune campagne", juste: k.choix === "aucune", retour: k.choix === "aucune" ? `Oui. ${faits} Aucune des deux ne rapporte plus de marge qu'elle ne coûte.` : `Non. ${faits}` },
        ];
      },
    },
  ],
};
