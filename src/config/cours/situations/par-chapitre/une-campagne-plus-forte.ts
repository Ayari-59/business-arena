import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import {
  HAUSSE_DE_LA_CAMPAGNE,
  TRIMESTRE_DE_LA_CAMPAGNE,
  UN_NOUVEAU_CLIENT,
  campagneDuChapitre,
  campagneRejouee,
  ceQueLaCampagneLaisse,
  tableauDeLaCampagne,
} from "../../chapitres/un-nouveau-client";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CE QUE RAPPORTE UN NOUVEAU CLIENT » : UNE CAMPAGNE PLUS FORTE
 * (Bac pro Métiers du commerce et de la vente, palier 2).
 *
 * Le responsable commercial veut refaire la campagne de janvier, deux fois plus forte. L'élève
 * lit l'année rejouée avec cette campagne, refait les calculs du chapitre (les ventes gagnées, le
 * coût d'une vente gagnée, la marge qu'elle rapporte, ce que la campagne laisse), puis choisit
 * entre la campagne plus forte, celle du chapitre et aucune campagne.
 *
 * Le cas est neuf par sa question : le chapitre juge une campagne, le cas en compare deux, et
 * l'absence de campagne. Les chiffres sont ceux de `campagneRejouee` (le chapitre) : au trimestre
 * de la campagne, le budget de publicité vaut celui de l'année du cours plus deux fois ce
 * budget, une valeur posée sur l'année du cours (clé « un-nouveau-client:… »). Le verdict se
 * calcule : il suit ce que chaque campagne laisse une fois payée.
 */

/** La campagne plus forte : deux fois la hausse du chapitre (hypothèse du cas). */
export const HAUSSE_PLUS_FORTE = 2 * HAUSSE_DE_LA_CAMPAGNE;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const T = (n: number) => `T${n}`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Ce qu'une campagne laisse une fois payée, ou ce qu'il lui manque. */
const bilan = (x: number) =>
  x > 0 ? `laisse ${eur(x)} une fois payée` : x < 0 ? `coûte ${eur(-x)} de plus qu'elle ne rapporte` : "se paie tout juste";

export type ChoixDeLaCampagne = "plus-forte" | "celle-de-janvier" | "aucune";

/** La campagne plus forte, celle du chapitre, et celle qui laisse le plus une fois payée. */
export function campagnePlusForte(c: Cas) {
  const forte = campagneRejouee(c, TRIMESTRE_DE_LA_CAMPAGNE, HAUSSE_PLUS_FORTE);
  const janvier = campagneDuChapitre(c);
  const choix: ChoixDeLaCampagne =
    forte.laisse <= 0 && janvier.laisse <= 0 ? "aucune" : forte.laisse > janvier.laisse ? "plus-forte" : "celle-de-janvier";
  return { forte, janvier, choix };
}

/** Ce que chaque campagne laisse, en une phrase. */
const lesDeux = (k: ReturnType<typeof campagnePlusForte>) =>
  `La campagne de janvier ${bilan(k.janvier.laisse)} ; la campagne plus forte ${bilan(k.forte.laisse)}.`;

export const UNE_CAMPAGNE_PLUS_FORTE: Situation = {
  code: "une-campagne-plus-forte",
  parcours: "vente",
  palier: 2,
  blocs: [],
  reprend: [UN_NOUVEAU_CLIENT.code],
  commanditaire: "Le responsable commercial",
  titre: "Une campagne plus forte",
  accroche:
    "Le responsable veut refaire la campagne de janvier, deux fois plus forte. Compter les ventes qu'elle gagne, ce que coûte chacune et ce qu'elle rapporte, et lui répondre.",
  objectifs: [
    "Compter les ventes gagnées par une campagne",
    "Calculer le coût et la marge d'une vente gagnée",
    "Choisir entre deux campagnes et aucune",
  ],
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
          `« La campagne de janvier a coûté ${eur(k.janvier.campagne)}. L'an prochain, je veux la faire deux fois plus forte : ${eur(k.forte.campagne)} de plus au ${T(k.forte.trimestre)}. Plus de publicité, plus de clients, non ? Dites-moi ce qu'il faut faire. »`,
          `Pas de cours cette fois. L'arène a rejoué l'année ${dE(c.entreprise)} avec la campagne plus forte, avec les mêmes concurrents et la même façon de gérer.`,
        ];
      },
      repere: () => "À rendre : les ventes gagnées, le coût et la marge d'une vente gagnée, et la campagne à faire.",
    },
    {
      id: "les-ventes",
      type: "montants",
      titre: "Les ventes de la campagne plus forte",
      notions: ["customer_acquisition_cost"],
      tableau: (c) => tableauDeLaCampagne(c, campagnePlusForte(c).forte, "la campagne plus forte"),
      question: () => "D'après le tableau, calculez les ventes gagnées sur l'année avec la campagne plus forte, puis le coût d'une vente gagnée (au centime).",
      champs: (c) => {
        const { forte: k } = campagnePlusForte(c);
        return [
          { libelle: "Ventes gagnées sur l'année", attendu: k.ventesGagnees, calcul: `${qte(k.ventesAvec)} − ${qte(k.ventesSans)} = ${qte(k.ventesGagnees)}`, tolerance: 0 },
          { libelle: "Coût d'une vente gagnée", attendu: k.coutDUneVente, calcul: `${eur(k.campagne)} ÷ ${qte(k.ventesGagnees)} = ${eur(k.coutDUneVente)}` },
        ];
      },
      explication: (c) => {
        const k = campagnePlusForte(c);
        return [
          `Avec la campagne de janvier, une vente gagnée coûtait ${eur(k.janvier.coutDUneVente)} ; avec la campagne plus forte, ${eur(k.forte.coutDUneVente)}. ${
            k.forte.coutDUneVente > k.janvier.coutDUneVente
              ? "Chaque euro de plus attire un peu moins de clients que le précédent : la vente gagnée coûte plus cher."
              : "La vente gagnée ne coûte pas plus cher : les clients en plus suivent la publicité."
          }`,
        ];
      },
    },
    {
      id: "la-marge",
      type: "montants",
      titre: "La marge de la campagne plus forte",
      notions: ["contribution_margin"],
      tableau: (c) => tableauDeLaCampagne(c, campagnePlusForte(c).forte, "la campagne plus forte"),
      question: () =>
        "D'après le tableau, calculez la marge gagnée sur l'année, la marge d'une vente gagnée (au centime), puis ce que la campagne laisse une fois payée (marge gagnée − coût de la campagne, négatif si elle ne se paie pas).",
      champs: (c) => {
        const { forte: k } = campagnePlusForte(c);
        return [
          { libelle: "Marge gagnée sur l'année", attendu: k.margeGagnee, calcul: `${eur(k.margeAvec)} − ${eur(k.margeSans)} = ${eur(k.margeGagnee)}`, tolerance: 1 },
          { libelle: "Marge d'une vente gagnée", attendu: k.margeDUneVente, calcul: `${eur(k.margeGagnee)} ÷ ${qte(k.ventesGagnees)} = ${eur(k.margeDUneVente)}` },
          { libelle: "Ce que la campagne laisse", attendu: k.laisse, calcul: `${eur(k.margeGagnee)} − ${eur(k.campagne)} = ${eur(k.laisse)}`, tolerance: 1 },
        ];
      },
      explication: (c) => [ceQueLaCampagneLaisse(campagnePlusForte(c).forte)],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      notions: ["customer_acquisition_cost"],
      question: (c) => {
        const k = campagnePlusForte(c);
        return `${lesDeux(k)} Quelle campagne conseillez-vous ?`;
      },
      options: (c) => {
        const k = campagnePlusForte(c);
        const faits = lesDeux(k);
        return [
          {
            texte: "Une campagne deux fois plus forte",
            juste: k.choix === "plus-forte",
            retour: k.choix === "plus-forte" ? `Oui. ${faits} Les ventes en plus paient la publicité en plus.` : `Non. ${faits}`,
          },
          {
            texte: "La campagne de janvier, sans plus",
            juste: k.choix === "celle-de-janvier",
            retour:
              k.choix === "celle-de-janvier"
                ? `Oui. ${faits} Au-delà, les ventes en plus ne paient plus la publicité en plus.`
                : `Non. ${faits}`,
          },
          {
            texte: "Aucune campagne, le budget normal",
            juste: k.choix === "aucune",
            retour: k.choix === "aucune" ? `Oui. ${faits} Aucune des deux ne rapporte plus de marge qu'elle ne coûte.` : `Non. ${faits}`,
          },
        ];
      },
    },
  ],
};
