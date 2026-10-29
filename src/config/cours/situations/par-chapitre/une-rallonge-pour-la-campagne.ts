import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { COMMUNICATION, communication } from "../../chapitres/communication";
import type { Situation } from "../types";

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

/**
 * CAS PRATIQUE DU CHAPITRE « CE QUE RAPPORTE LA COMMUNICATION » : UNE RALLONGE POUR LA
 * CAMPAGNE ? (Bac STMG, mercatique, palier 1).
 *
 * L'équipe marketing demande une rallonge du budget de communication.
 * La direction veut savoir, avant d'accepter, ce que ces euros en plus feraient vendre et
 * s'ils se paieraient. L'élève a un trimestre de l'année type du marché à trois (monde/attractivite.ts) sans campagne, au budget de la campagne et au
 * budget augmenté, et refait seul les calculs du chapitre : les ventes gagnées et le coût
 * d'une vente gagnée par la campagne de l'agence, puis les mêmes calculs pour la rallonge,
 * la marge qu'elle apporte et ce qu'elle rapporte une fois payée.
 *
 * Le cas est neuf par sa question : le chapitre juge la campagne entière, depuis zéro, le
 * cas juge les euros ajoutés à une campagne qui existe déjà. Les budgets sont ceux
 * du chapitre (`communication`, `campagne.ts`).
 */

/**
 * Le budget demandé, en multiple du budget de la campagne : une fois et demie, la moitié en plus.
 * C'est l'un des budgets que le chapitre essaie (FACTEURS_DE_BUDGET, monde/mercatique-de-nova.ts), et la rallonge qu'une
 * équipe marketing demande couramment pour accélérer.
 */
export const FACTEUR_DE_LA_RALLONGE = 1.5;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`.replace(/^-/, "−");
/** La hausse de budget demandée, en pourcentage du budget de la campagne. */
const HAUSSE_DU_BUDGET = pct((FACTEUR_DE_LA_RALLONGE - 1) * 100);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function rallongeDeLaCampagne(c: Cas) {
  const k = communication(c);
  const jouee = k.jouee;
  const rallonge = k.budgets.find((b) => b.facteur === FACTEUR_DE_LA_RALLONGE)!;
  const budgetEnPlus = rallonge.budget - jouee.budget;
  const ventesEnPlus = rallonge.ventes - jouee.ventes;
  const margeEnPlus = Math.round((rallonge.marge - jouee.marge) * 100) / 100;
  return {
    sans: k.sans,
    jouee,
    rallonge,
    ventesDeLaCampagne: k.ventesEnPlus,
    coutParVente: k.coutParVente,
    budgetEnPlus,
    ventesEnPlus,
    coutParVenteEnPlus: ventesEnPlus > 0 ? auCentime(budgetEnPlus / ventesEnPlus) : null,
    margeEnPlus,
    gain: margeEnPlus - budgetEnPlus,
    // L'erreur classique : compter les ventes depuis le trimestre sans campagne, pas depuis le budget de la campagne.
    ventesDepuisZero: rallonge.ventes - k.sans.ventes,
    // L'erreur classique : croire que chaque euro en plus fait vendre autant que les premiers.
    ventesAuMemeCout: Math.round(budgetEnPlus / k.coutParVente),
  };
}

export const UNE_RALLONGE_POUR_LA_CAMPAGNE: Situation = {
  code: "une-rallonge-pour-la-campagne",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["ce-que-rapporte-la-communication"],
  commanditaire: "La direction",
  titre: "Une rallonge pour la campagne ?",
  accroche:
    `L'équipe marketing demande ${HAUSSE_DU_BUDGET} de budget de communication en plus. Ce que ces euros feraient vendre, et s'ils se paieraient.`,
  objectifs: [
    "Calculer les ventes gagnées et le coût d'une vente gagnée par une campagne",
    "Mesurer ce qu'apportent les euros ajoutés à une campagne",
    "Calculer ce que rapporte une hausse de budget une fois payée",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  entreprises: COMMUNICATION.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          `« L'équipe marketing me demande une rallonge de ${HAUSSE_DU_BUDGET} : passer de ${eur(r.jouee.budget)} à ${eur(r.rallonge.budget)} de communication par trimestre. Avant d'accepter, je veux savoir ce que ces ${eur(r.budgetEnPlus)} en plus feraient vendre à ${c.entreprise}, et s'ils se paieraient. »`,
          "Pas de cours cette fois : le tableau donne le trimestre sans campagne, avec la campagne de l'agence et avec le budget demandé. Les calculs sont ceux du chapitre.",
        ];
      },
      tableau: (c) => {
        const r = rallongeDeLaCampagne(c);
        const t = [r.sans, r.jouee, r.rallonge];
        return {
          titre: `Un trimestre, à trois budgets · ${c.entreprise}`,
          colonnes: ["Sans campagne", "Campagne de l'agence", "Budget demandé"],
          lignes: [
            { libelle: "Budget de communication", valeurs: t.map((b) => eur(b.budget)) },
            { libelle: `Ventes (${c.unites})`, valeurs: t.map((b) => qte(b.ventes)) },
            { libelle: "Chiffre d'affaires", valeurs: t.map((b) => eur(b.chiffreDAffaires)) },
            { libelle: "Marge sur les ventes", valeurs: t.map((b) => eur(b.marge)) },
          ],
        };
      },
      repere: () =>
        "À rendre : ce que fait la campagne de l'agence, les ventes et la marge qu'apporterait la rallonge, ce qu'elle rapporterait une fois payée, et votre réponse.",
    },
    {
      id: "campagne-actuelle",
      type: "montants",
      titre: "Ce que fait la campagne de l'agence",
      notions: ["customer_acquisition_cost"],
      question: () =>
        "Comparez le trimestre sans campagne et le trimestre au budget de la campagne : combien de ventes la campagne de l'agence fait-elle gagner, et combien coûte chacune en communication ?",
      champs: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          { libelle: "Ventes gagnées par la campagne de l'agence", attendu: r.ventesDeLaCampagne, calcul: `${qte(r.jouee.ventes)} − ${qte(r.sans.ventes)} = ${qte(r.ventesDeLaCampagne)}` },
          { libelle: "Coût d'une vente gagnée", attendu: r.coutParVente, tolerance: 0.01, calcul: `${eur(r.jouee.budget)} ÷ ${qte(r.ventesDeLaCampagne)} = ${eur(r.coutParVente)}` },
        ];
      },
      explication: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          `Aujourd'hui, chaque vente que la campagne fait gagner coûte ${eur(r.coutParVente)} de communication. C'est le repère pour juger la rallonge : ses euros feront-ils vendre au même coût ?`,
        ];
      },
    },
    {
      id: "rallonge",
      type: "montants",
      titre: "Ce que ferait la rallonge",
      notions: ["customer_acquisition_cost"],
      question: (c) =>
        rallongeDeLaCampagne(c).ventesEnPlus > 0
          ? "Comparez maintenant le budget de la campagne et le budget demandé : le budget en plus, les ventes en plus, puis le coût de chaque vente gagnée par la rallonge."
          : "Comparez maintenant le budget de la campagne et le budget demandé : le budget en plus, puis les ventes en plus.",
      champs: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          { libelle: "Budget en plus", attendu: r.budgetEnPlus, calcul: `${eur(r.rallonge.budget)} − ${eur(r.jouee.budget)} = ${eur(r.budgetEnPlus)}` },
          { libelle: `Ventes en plus (${c.unites})`, attendu: r.ventesEnPlus, calcul: `${qte(r.rallonge.ventes)} − ${qte(r.jouee.ventes)} = ${qte(r.ventesEnPlus)}` },
          ...(r.coutParVenteEnPlus !== null
            ? [{ libelle: "Coût d'une vente gagnée par la rallonge", attendu: r.coutParVenteEnPlus, tolerance: 0.01, calcul: `${eur(r.budgetEnPlus)} ÷ ${qte(r.ventesEnPlus)} = ${eur(r.coutParVenteEnPlus)}` }]
            : []),
        ];
      },
      explication: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          r.coutParVenteEnPlus !== null
            ? `Les euros de la rallonge font vendre moins que les premiers : chaque vente gagnée coûterait ${eur(r.coutParVenteEnPlus)}, contre ${eur(r.coutParVente)} avec la campagne de l'agence. La campagne a déjà convaincu les clients les plus faciles.`
            : `Les ventes restent à ${qte(r.jouee.ventes)} : ${c.entreprise} sert déjà tout ce qu'elle peut servir. La rallonge attirerait des clients qui repartiraient sans être servis.`,
        ];
      },
    },
    {
      id: "ce-que-rapporte-la-rallonge",
      type: "montants",
      titre: "Ce que rapporterait la rallonge",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: () =>
        "Calculez la marge en plus qu'apporterait la rallonge, puis ce qu'elle rapporterait une fois payée (marge en plus moins budget en plus). Un résultat négatif dit qu'elle coûte plus qu'elle ne rapporte.",
      champs: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          { libelle: "Marge en plus", attendu: r.margeEnPlus, calcul: `${eur(r.rallonge.marge)} − ${eur(r.jouee.marge)} = ${eur(r.margeEnPlus)}` },
          { libelle: "Gain de la rallonge", attendu: r.gain, calcul: `${eur(r.margeEnPlus)} − ${eur(r.budgetEnPlus)} = ${eur(r.gain)}` },
        ];
      },
      explication: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          r.gain > 0
            ? `La marge des ventes en plus paie la rallonge et laisse ${eur(r.gain)} : pour ${c.entreprise}, ces euros de communication se paient encore.`
            : `La marge des ventes en plus ne paie pas la rallonge : ${c.entreprise} perdrait ${eur(-r.gain)} sur le trimestre. Au-delà du budget de la campagne, un euro de communication ne se paie plus.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = rallongeDeLaCampagne(c);
        const aucune = `${accord(c, "aucun")} ${c.unite}`;
        return [
          r.gain > 0
            ? {
                texte: `Oui : une fois payée, la rallonge rapporterait ${eur(r.gain)}`,
                juste: true,
                retour: `Oui : ${qte(r.ventesEnPlus)} ventes en plus laissent ${eur(r.margeEnPlus)} de marge, plus que les ${eur(r.budgetEnPlus)} de la rallonge.`,
              }
            : {
                texte: `Non : la rallonge coûterait ${eur(-r.gain)} de plus qu'elle ne rapporte`,
                juste: true,
                retour:
                  r.ventesEnPlus > 0
                    ? `Oui : ${qte(r.ventesEnPlus)} ${r.ventesEnPlus >= 2 ? "ventes" : "vente"} en plus ne laissent que ${eur(r.margeEnPlus)} de marge, moins que les ${eur(r.budgetEnPlus)} de la rallonge.`
                    : `Oui : la rallonge ne ferait vendre ${aucune} de plus. Ses ${eur(r.budgetEnPlus)} seraient dépensés sans rien rapporter.`,
              },
          {
            texte: `Elle ferait vendre ${qte(r.ventesAuMemeCout)} ${c.unites} de plus, au même coût par vente qu'aujourd'hui`,
            juste: false,
            retour: `Non : chaque euro en plus fait vendre moins que le précédent. La campagne de l'agence gagne une vente pour ${eur(r.coutParVente)}, mais la rallonge ${r.coutParVenteEnPlus !== null ? `n'apporterait que ${qte(r.ventesEnPlus)} ${c.unites}, à ${eur(r.coutParVenteEnPlus)} ${accord(c, "chacun")}` : `ne ferait vendre ${aucune} de plus`}.`,
          },
          {
            texte: `La rallonge ferait vendre ${qte(r.ventesDepuisZero)} ${c.unites} de plus`,
            juste: false,
            retour: `Non : ce sont les ventes en plus par rapport au trimestre sans campagne. La rallonge s'ajoute au budget de la campagne : c'est à lui qu'il faut comparer, et elle ${r.ventesEnPlus > 0 ? `n'apporte que ${qte(r.ventesEnPlus)} ${c.unites}` : `n'apporte ${aucune} de plus`}.`,
          },
          ...(r.ventesEnPlus === 0
            ? [
                {
                  texte: "Oui : plus de publicité fait toujours vendre davantage",
                  juste: false,
                  retour: `Non : au budget demandé, les ventes restent à ${qte(r.jouee.ventes)}. ${c.entreprise} ne peut pas servir plus de clients : la rallonge serait dépensée pour rien.`,
                },
              ]
            : []),
        ];
      },
    },
  ],
};
