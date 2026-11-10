import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_IMPLANTATION, rejoindreLeCluster } from "../../monde/implantation-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « S'IMPLANTER SUR UN TERRITOIRE » : REJOINDRE LE CLUSTER DE L'AUDIO ? (Bac
 * STMG, enseignement commun de terminale, palier 1).
 *
 * Le chapitre reconnaissait un cluster ; le cas chiffre ce que NOVA gagnerait à y entrer, par ses achats
 * groupés. Hypothèses : monde/implantation-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const REJOINDRE_LE_CLUSTER_DE_L_AUDIO: Situation = {
  code: "rejoindre-le-cluster-de-l-audio",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["s-implanter-sur-un-territoire"],
  commanditaire: "Le président",
  titre: "Rejoindre le cluster de l'audio ?",
  accroche: "Les fabricants audio de la région invitent NOVA dans leur cluster. La cotisation se paie-t-elle par les achats groupés ?",
  objectifs: ["Chiffrer l'intérêt d'un réseau d'entreprises", "Reconnaître ce qu'un cluster apporte au-delà des chiffres", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_IMPLANTATION, pourquoi: "le cas reprend les achats de composants de NOVA." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const k = rejoindreLeCluster();
        return [
          `« Le cluster de l'audio nous invite. La cotisation est de ${eur(k.cotisation)} par an. Ses membres achètent leurs composants ensemble, ${pct(k.baissePct)} moins cher. L'an dernier, nous en avons acheté pour ${eur(k.composants)}. Faut-il y entrer ? » Le président`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : l'économie sur les composants, le gain de l'année et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que rapporte le cluster",
      question: () => "Calculez l'économie sur les composants de l'année, puis le gain une fois la cotisation payée.",
      champs: () => {
        const k = rejoindreLeCluster();
        return [
          { libelle: "Économie sur les composants", attendu: k.economie, calcul: `${eur(k.composants)} × ${pct(k.baissePct)} = ${eur(k.economie)}` },
          { libelle: "Gain de l'année", attendu: k.gain, calcul: `${eur(k.economie)} − ${eur(k.cotisation)} = ${eur(k.gain)}` },
        ];
      },
      explication: () => [`Les achats groupés paient la cotisation et laissent ${eur(rejoindreLeCluster().gain)}.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = rejoindreLeCluster();
        return [
          {
            texte: `Y entrer : ${eur(k.gain)} de gain, et un réseau en plus`,
            juste: true,
            retour: "Oui : les achats groupés suffisent à payer la cotisation. Le cluster apporte aussi ce qui ne se chiffre pas tout de suite : des contacts, des salons partagés, des idées, des recrutements entre membres.",
          },
          {
            texte: "Refuser : coopérer avec des concurrents est toujours dangereux",
            juste: false,
            retour: "Non : dans un cluster, les entreprises coopèrent sur ce qui les rapproche (les achats, la formation) et restent concurrentes sur leurs produits.",
          },
          {
            texte: "Refuser : une cotisation est une charge, elle fait baisser le résultat",
            juste: false,
            retour: "Non : la cotisation est une charge, mais l'économie sur les composants est plus grande. Le résultat monte.",
          },
        ];
      },
    },
  ],
};
