import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { QUALITES, demarche, demarchesContreLesDefauts } from "../../chapitres/le-cout-de-la-non-qualite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COÛT DE LA NON-QUALITÉ » : UNE SEULE DÉMARCHE QUALITÉ CETTE
 * ANNÉE (BTS GPME, gestion des risques, palier 3).
 *
 * Le gérant ne financera qu'une démarche qualité cette année, et hésite entre les deux que le
 * catalogue de l'arène propose contre les défauts. L'élève refait pour chacune le calcul du
 * chapitre (le gain d'une année, non-qualité évitée et économies de production, puis le délai de
 * récupération), et rend son choix.
 *
 * Le cas est neuf par sa question : le chapitre juge une démarche seule, le cas en compare deux.
 * Les deux démarches sont les deux premières du catalogue qui visent les défauts
 * (`demarchesContreLesDefauts`), chacune jouée seule au premier trimestre (`demarche`).
 */

/**
 * Le délai de récupération au-delà duquel le gérant renonce : trois ans, l'horizon de son plan.
 * Une hypothèse du cours.
 */
export const HORIZON_DU_GERANT_EN_ANNEES = 3;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const ans = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} an${x >= 2 ? "s" : ""}`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "premiere" | "deuxieme" | "aucune";

/** Les deux démarches, et celle qu'il faut financer. */
export function deuxDemarches(c: Cas) {
  const [a, b] = demarchesContreLesDefauts(c.code);
  const premiere = demarche(c.code, a!);
  const deuxieme = demarche(c.code, b!);
  const delai = (d: typeof premiere) => d.delai ?? Number.POSITIVE_INFINITY;
  const verdict: Verdict =
    Math.min(delai(premiere), delai(deuxieme)) > HORIZON_DU_GERANT_EN_ANNEES
      ? "aucune"
      : delai(premiere) <= delai(deuxieme)
        ? "premiere"
        : "deuxieme";
  return { premiere, deuxieme, verdict };
}

const champsDeLaDemarche = (rang: string, d: ReturnType<typeof demarche>) => ({
  gain: {
    libelle: `Gain de l'année, ${rang} démarche`,
    attendu: d.gain,
    calcul: `(${eur(d.nonQualiteSans)} − ${retranche(d.nonQualiteAvec)}) + (${eur(d.economiesAvec)} − ${retranche(d.economiesSans)}) = ${eur(d.gain)}`,
    tolerance: 1,
  },
  delai: {
    libelle: `Délai de récupération, ${rang} démarche (années)`,
    attendu: d.delai ?? 0,
    calcul: `${eur(d.cout)} ÷ ${eur(d.gain)} = ${ans(d.delai ?? 0)}`,
    tolerance: 0.1,
  },
});

export const UNE_SEULE_DEMARCHE_QUALITE: Situation = {
  code: "une-seule-demarche-qualite",
  parcours: "gpme",
  palier: 3,
  blocs: [],
  reprend: ["le-cout-de-la-non-qualite"],
  commanditaire: "Le gérant",
  titre: "Une seule démarche qualité cette année",
  accroche:
    "Le gérant ne financera qu'une démarche qualité cette année, et hésite entre deux. Ce que chacune évite et économise sur l'année, le temps qu'elle met à se rembourser, et le choix à lui rendre.",
  objectifs: [
    "Calculer le gain d'une démarche qualité sur une année",
    "Calculer son délai de récupération",
    "Comparer deux démarches par leur délai de récupération",
    "Répondre au gérant, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: QUALITES,
    pourquoi:
      "ce cas reprend le chapitre sur le coût de la non-qualité, qui compare des budgets de prévention autour de celui de l'année. Ailleurs, le moteur ne chiffre pas la non-qualité ; chez PIXEL & CO, il la chiffre, mais l'année du cours n'engage aucun budget de prévention.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const { premiere, deuxieme } = deuxDemarches(c);
        return [
          `« Nous ne financerons qu'une démarche qualité cette année : la première, « ${premiere.niveau} », ou la deuxième, « ${deuxieme.niveau} ». Laquelle ${c.entreprise} doit-elle choisir ? Si aucune ne se rembourse en ${HORIZON_DU_GERANT_EN_ANNEES} ans, je préfère renoncer. »`,
          "Pas de cours cette fois : vous avez ce que chaque démarche change à l'année, rejouée par l'arène avec la démarche décidée au premier trimestre, et la méthode est celle du chapitre. Les années suivantes, chaque démarche est supposée gagner autant que la première.",
        ];
      },
      tableau: (c) => {
        const { premiere, deuxieme } = deuxDemarches(c);
        return {
          titre: `Les deux démarches ${dE(c.entreprise)}, sur l'année rejouée`,
          colonnes: ["Sans démarche", "Première démarche", "Deuxième démarche"],
          lignes: [
            { libelle: "Coût de la démarche, payé une fois", valeurs: [eur(0), eur(premiere.cout), eur(deuxieme.cout)] },
            { libelle: "Non-qualité de l'année : rebuts et retours", valeurs: [eur(premiere.nonQualiteSans), eur(premiere.nonQualiteAvec), eur(deuxieme.nonQualiteAvec)] },
            { libelle: "Économies sur les coûts de production", valeurs: [eur(premiere.economiesSans), eur(premiere.economiesAvec), eur(deuxieme.economiesAvec)] },
          ],
        };
      },
      repere: () => "À rendre : le gain d'une année et le délai de récupération de chaque démarche, puis votre choix.",
    },
    {
      id: "gains",
      type: "montants",
      titre: "Ce que chaque démarche rapporte",
      notions: ["variable_costs"],
      question: () => "Pour chaque démarche, calculez le gain de l'année : la non-qualité évitée, plus les économies de production.",
      champs: (c) => {
        const { premiere, deuxieme } = deuxDemarches(c);
        return [champsDeLaDemarche("première", premiere).gain, champsDeLaDemarche("deuxième", deuxieme).gain];
      },
      explication: (c) => {
        const { premiere, deuxieme } = deuxDemarches(c);
        return [
          `La première rapporte ${eur(premiere.gain)} par an, dont ${eur(premiere.evitees)} de non-qualité évitée ; la deuxième ${eur(deuxieme.gain)}, dont ${eur(deuxieme.evitees)} de non-qualité évitée. Les économies de production, le moteur les inscrit à part, en produit exceptionnel.`,
        ];
      },
    },
    {
      id: "delais",
      type: "montants",
      titre: "Le temps de se rembourser",
      notions: ["irr_payback"],
      question: () => "Pour chaque démarche, calculez le délai de récupération en années (coût ÷ gain d'une année), à 0,1 près.",
      champs: (c) => {
        const { premiere, deuxieme } = deuxDemarches(c);
        return [champsDeLaDemarche("première", premiere).delai, champsDeLaDemarche("deuxième", deuxieme).delai];
      },
      explication: (c) => {
        const { premiere, deuxieme } = deuxDemarches(c);
        return [
          `La première se rembourse en ${ans(premiere.delai ?? 0)}, la deuxième en ${ans(deuxieme.delai ?? 0)}. La moins chère n'est pas forcément la plus rapide à se rembourser : c'est le gain de chaque année qui décide.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const { premiere, deuxieme, verdict } = deuxDemarches(c);
        const compare = `${ans(premiere.delai ?? 0)} pour la première, ${ans(deuxieme.delai ?? 0)} pour la deuxième`;
        return [
          {
            texte: "Financer la première démarche : elle se rembourse plus vite",
            juste: verdict === "premiere",
            retour: verdict === "premiere" ? `Oui : ${compare}, sous les ${HORIZON_DU_GERANT_EN_ANNEES} ans que vous vous donnez.` : `Non : ${compare}.`,
          },
          {
            texte: "Financer la deuxième démarche : elle se rembourse plus vite",
            juste: verdict === "deuxieme",
            retour: verdict === "deuxieme" ? `Oui : ${compare}, sous les ${HORIZON_DU_GERANT_EN_ANNEES} ans que vous vous donnez.` : `Non : ${compare}.`,
          },
          {
            texte: `Renoncer : ni l'une ni l'autre ne se rembourse en ${HORIZON_DU_GERANT_EN_ANNEES} ans`,
            juste: verdict === "aucune",
            retour:
              verdict === "aucune"
                ? `Oui : ${compare}, au-delà des ${HORIZON_DU_GERANT_EN_ANNEES} ans que vous vous donnez.`
                : `Non : ${compare}. L'une au moins se rembourse dans les ${HORIZON_DU_GERANT_EN_ANNEES} ans, et ses effets restent ensuite.`,
          },
        ];
      },
    },
  ],
};
