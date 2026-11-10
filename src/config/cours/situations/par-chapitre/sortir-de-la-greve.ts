import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_CLIMAT_SOCIAL, leCompromis } from "../../monde/climat-social-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE CLIMAT SOCIAL ET LE CONFLIT » : SORTIR DE LA GRÈVE (Bac STMG, ressources
 * humaines et communication de terminale, palier 1).
 *
 * Le chapitre chiffrait ce que coûte chaque jour de grève ; le cas chiffre la sortie du conflit, le
 * compromis face à la hausse entière, et demande comment le conclure. Hypothèses :
 * monde/climat-social-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR")} %`;

export const SORTIR_DE_LA_GREVE: Situation = {
  code: "sortir-de-la-greve",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["le-climat-social-et-le-conflit"],
  commanditaire: "Le président",
  titre: "Sortir de la grève",
  accroche: "La ligne est arrêtée, et le président veut proposer un compromis. Ce que la grève a déjà coûté, ce que coûterait le compromis, et comment le conclure.",
  objectifs: ["Chiffrer le coût du conflit et celui du compromis", "Choisir la façon de conclure", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_CLIMAT_SOCIAL, pourquoi: "le cas reprend le conflit des opérateurs de NOVA." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const k = leCompromis();
        return [
          `« La ligne est arrêtée depuis ${qte(k.jours)} jours. Je pense proposer ${pct(k.taux)} de hausse, soit ${eur(k.augmentation)} bruts par mois et par opérateur, et un accord d'intéressement. Combien la grève nous a-t-elle coûté, et que coûterait ma proposition sur l'année ? Et ensuite, je fais quoi ? » Le président`,
          "Pas de cours cette fois : les notions et les coûts sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de la grève, celui du compromis, ce qu'il épargne face à la hausse entière, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Le conflit et le compromis",
      question: () => "Calculez le coût des jours de grève pour NOVA, le coût du compromis sur l'année (cotisations patronales comprises), puis ce qu'il épargne face à la hausse entière.",
      champs: () => {
        const k = leCompromis();
        return [
          { libelle: "Coût des jours de grève", attendu: k.greve, calcul: `${qte(k.jours)} × ${eur(k.coutDUneJournee)} = ${eur(k.greve)}` },
          { libelle: "Coût du compromis sur l'année", attendu: k.compromis, calcul: `${eur(k.augmentation)} × 12 × ${qte(k.operateurs)} × ${k.coefficient.toLocaleString("fr-FR")} = ${eur(k.compromis)}` },
          { libelle: "Économie face à la hausse entière", attendu: k.economie, calcul: `${eur(k.entiere)} − ${eur(k.compromis)} = ${eur(k.economie)}` },
        ];
      },
      explication: () => {
        const k = leCompromis();
        return [`La grève a déjà coûté ${eur(k.greve)} ; le compromis coûterait ${eur(k.compromis)} sur l'année, ${eur(k.economie)} de moins que la hausse entière.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Comment le président doit-il conclure ?",
      options: () => {
        const k = leCompromis();
        return [
          {
            texte: "Négocier avec l'équipe et signer un accord écrit",
            juste: true,
            retour: `Oui : le compromis (${eur(k.compromis)} sur l'année) se discute avec l'équipe ; écrit, il fixe ce que chacun s'engage à faire, et le calendrier de l'intéressement. La grève, qui a déjà coûté ${eur(k.greve)}, s'arrête, et la confiance peut revenir.`,
          },
          {
            texte: "Afficher sa décision dans l'atelier, et retenir les jours de grève sur la prochaine paie en plus du salaire",
            juste: false,
            retour: "Non : imposer sans discuter ne règle pas le conflit. Et la retenue ne porte que sur le temps d'arrêt, pas au-delà : une sanction pécuniaire est interdite.",
          },
          {
            texte: "Attendre que l'équipe accepte d'elle-même",
            juste: false,
            retour: "Non : chaque jour de grève coûte à NOVA et aux opérateurs. Le président doit ouvrir la négociation.",
          },
        ];
      },
    },
  ],
};
