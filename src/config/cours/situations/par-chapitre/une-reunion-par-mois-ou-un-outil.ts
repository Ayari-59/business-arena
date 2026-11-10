import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_COMMUNICATION_INTERNE, reunionOuOutil } from "../../monde/communication-interne-d-atlas";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « COMMUNICATION INTERNE ET MARQUE EMPLOYEUR » : UNE RÉUNION PAR MOIS OU UN
 * OUTIL ? (Bac STMG, ressources humaines et communication de terminale, palier 1).
 *
 * Le chapitre chiffrait ce qu'un outil collaboratif doit faire gagner ; le cas compare, sur l'année, une
 * réunion chaque mois et l'outil avec une réunion par trimestre. Hypothèses :
 * monde/communication-interne-d-atlas.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const UNE_REUNION_PAR_MOIS_OU_UN_OUTIL: Situation = {
  code: "une-reunion-par-mois-ou-un-outil",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["communication-interne-et-marque-employeur"],
  commanditaire: "La directrice",
  titre: "Une réunion par mois ou un outil ?",
  accroche: "Pour que ses consultants se retrouvent, la directrice hésite entre une réunion chaque mois au cabinet, et un outil collaboratif avec une réunion par trimestre.",
  objectifs: ["Chiffrer deux façons de communiquer en interne", "Tenir compte de ce que chacune apporte à la cohésion", "Répondre à la directrice, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_COMMUNICATION_INTERNE, pourquoi: "le cas reprend les consultants d'ATLAS CONSEIL et le coût de leurs journées." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice",
      texte: () => {
        const k = reunionOuOutil();
        return [
          `« Une réunion au cabinet prend une demi-journée à chacun de nos ${qte(k.consultants)} consultants, et une journée de consultant nous coûte ${eur(k.coutDUneJournee)}. L'outil collaboratif coûte ${eur(k.parMois)} par consultant et par mois. Une réunion chaque mois, ou l'outil et une réunion par trimestre ? » La directrice`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût d'une réunion, celui de chaque solution sur l'année, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que coûte chaque solution",
      question: () => "Calculez le coût d'une réunion, celui d'une réunion chaque mois sur l'année, puis celui de l'outil avec une réunion par trimestre.",
      champs: () => {
        const k = reunionOuOutil();
        return [
          { libelle: "Coût d'une réunion", attendu: k.reunion, calcul: `${qte(k.consultants)} × ${k.partDeJournee.toLocaleString("fr-FR")} × ${eur(k.coutDUneJournee)} = ${eur(k.reunion)}` },
          { libelle: "Une réunion chaque mois, sur l'année", attendu: k.chaqueMois, calcul: `12 × ${eur(k.reunion)} = ${eur(k.chaqueMois)}` },
          { libelle: "L'outil et une réunion par trimestre", attendu: k.outilEtTrimestre, calcul: `${qte(k.consultants)} × ${eur(k.parMois)} × 12 + 4 × ${eur(k.reunion)} = ${eur(k.outilEtTrimestre)}` },
        ];
      },
      explication: () => [`L'outil et une réunion par trimestre coûtent ${eur(reunionOuOutil().ecart)} de moins sur l'année.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      question: () => "Que répondez-vous à la directrice ?",
      options: () => {
        const k = reunionOuOutil();
        return [
          {
            texte: "L'outil au quotidien, et une vraie rencontre chaque trimestre",
            juste: true,
            retour: `Oui : ${eur(k.ecart)} de moins sur l'année, et chacun a les deux. L'outil fait coopérer au jour le jour ; la rencontre, plus rare mais préparée, crée les liens que l'écran ne crée pas.`,
          },
          {
            texte: "L'outil seul : il coûte encore moins, et les consultants n'ont plus besoin de se voir",
            juste: false,
            retour: "Non : un outil ne remplace pas les rencontres. Les deux consultants partis se sentaient seuls, pas mal équipés.",
          },
          {
            texte: "Une réunion chaque mois, et rien d'autre",
            juste: false,
            retour: `Non : elle coûte ${eur(k.chaqueMois)} par an, et ne fait pas coopérer entre deux réunions.`,
          },
        ];
      },
    },
  ],
};
