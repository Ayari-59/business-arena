import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_RSE, laboratoireDuLabel, responsabilite } from "../../chapitres/la-responsabilite-societale";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CE QUE RAPPORTE L'ENGAGEMENT : L'ANNÉE, LE COÛT COMPLET, LA STRATÉGIE »
 * (stratégie, palier 4).
 *
 * Le directeur financier propose de diviser le budget RSE par deux : `BUDGET_MODESTE` par trimestre,
 * toute l'année. L'élève refait le calcul de l'année du chapitre (`laboratoireDuLabel`, le modèle
 * d'attractivité du monde du cours) : ce que l'engagement coûte, les enceintes qu'il fait vendre en
 * plus, et ce qu'il change au résultat, face au plan du chapitre.
 */

/** LE BUDGET RSE PROPOSÉ (hypothèse du cas) : 6 000 € par trimestre, la moitié du plan du chapitre. */
export const BUDGET_MODESTE = 6_000;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");

export function engagementPlusModeste() {
  const x = responsabilite({ code: "nova" });
  const l = laboratoireDuLabel(x, [BUDGET_MODESTE, BUDGET_MODESTE, BUDGET_MODESTE, BUDGET_MODESTE]);
  const ventesGagnees = l.ventes - x.annee.sans.ventes;
  return { x, l, ventesGagnees, perdMoins: l.ecart > x.annee.ecart };
}

export const UN_ENGAGEMENT_PLUS_MODESTE: Situation = {
  code: "un-engagement-plus-modeste",
  parcours: "strategie",
  palier: 4,
  blocs: [],
  reprend: ["ce-que-rapporte-l-engagement"],
  commanditaire: "Le directeur financier",
  titre: "Un engagement plus modeste",
  accroche: "Diviser le budget RSE par deux : ce que l'année y gagne en charges, ce qu'elle y perd en ventes, et ce qu'en dit la stratégie.",
  objectifs: ["Chiffrer le coût d'un engagement sur l'année", "Mesurer les ventes qu'il gagne et son effet sur le résultat", "Juger une économie qui renonce au label"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_RSE, pourquoi: "ce cas reprend l'engagement de NOVA et le modèle d'attractivité du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du directeur financier",
      texte: (c) => {
        const k = engagementPlusModeste();
        return [
          `« Le plan à ${eur(k.x.b)} par trimestre coûte ${eur(k.x.annee.cout)} sur l'année et fait baisser le résultat de ${eur(-k.x.annee.ecart)}. Passons à ${eur(BUDGET_MODESTE)} par trimestre : nous perdrions moins. » Le directeur financier de ${c.entreprise}`,
          "Pas de cours cette fois : la simulation du cours refait l'année trimestre par trimestre, l'attractivité suit le capital-image, les ventes suivent l'attractivité.",
        ];
      },
      repere: () => "À rendre : le coût de l'année, les enceintes vendues en plus, l'écart de résultat face à l'année sans engagement, et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "L'année à budget réduit",
      notions: ["csr_index", "brand_capital"],
      question: () => "Lisez l'année à budget réduit : son coût, les enceintes vendues en plus de l'année sans engagement, puis son effet sur le résultat (négatif s'il le fait baisser).",
      champs: () => {
        const k = engagementPlusModeste();
        return [
          { libelle: "Coût de l'engagement sur l'année", attendu: k.l.cout, calcul: `4 × ${eur(BUDGET_MODESTE)} = ${eur(k.l.cout)}` },
          { libelle: "Enceintes vendues en plus", attendu: k.ventesGagnees, calcul: `${qte(k.l.ventes)} − ${qte(k.x.annee.sans.ventes)} = ${qte(k.ventesGagnees)}` },
          { libelle: "Effet sur le résultat de l'année", attendu: k.l.ecart, calcul: `${eur(k.l.ecart)}, la marge des ventes en plus moins le coût de l'engagement` },
        ];
      },
      explication: () => {
        const k = engagementPlusModeste();
        return [`À ${eur(BUDGET_MODESTE)} par trimestre, l'engagement coûte ${eur(k.l.cout)} et fait vendre ${qte(k.ventesGagnees)} enceintes de plus : le résultat change de ${eur(k.l.ecart)}, contre ${eur(k.x.annee.ecart)} au plan du chapitre.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      question: () => "Que répondez-vous au directeur financier ?",
      options: () => {
        const k = engagementPlusModeste();
        return [
          {
            texte: "Il perd moins cette année, mais renonce au label",
            juste: k.perdMoins,
            retour: `Oui : ${eur(k.l.ecart)} au lieu de ${eur(k.x.annee.ecart)}. Mais à ce budget, le capital-image plafonne encore plus bas : le label ne viendra jamais, et c'est lui que la stratégie visait.`,
          },
          {
            texte: "Il perd plus cette année : un budget plus petit fait vendre moins, et les ventes payaient l'engagement",
            juste: !k.perdMoins,
            retour: `Non : les ventes gagnées baissent, mais le coût baisse davantage. Le résultat change de ${eur(k.l.ecart)}, contre ${eur(k.x.annee.ecart)} au plan du chapitre.`,
          },
          {
            texte: "Il rapporte autant : le capital-image tend toujours vers le même plafond, quel que soit le budget",
            juste: false,
            retour: "Non : le plafond du capital-image est l'effort, et l'effort monte avec le budget. Un budget plus petit plafonne plus bas.",
          },
        ];
      },
    },
  ],
};
