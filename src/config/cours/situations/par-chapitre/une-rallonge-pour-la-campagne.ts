import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { COMMUNICATIONS, communication } from "../../chapitres/communication";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CE QUE RAPPORTE LA COMMUNICATION » : UNE RALLONGE POUR LA
 * CAMPAGNE ? (Bac STMG, mercatique, palier 1).
 *
 * L'équipe marketing demande une rallonge du budget de communication.
 * La direction veut savoir, avant d'accepter, ce que ces euros en plus feraient vendre et
 * s'ils se paieraient. L'élève a le trimestre rejoué sans campagne, au budget actuel et au
 * budget augmenté, et refait seul les calculs du chapitre : les ventes gagnées et le coût
 * d'une vente gagnée par la campagne actuelle, puis les mêmes calculs pour la rallonge,
 * la marge qu'elle apporte et ce qu'elle rapporte une fois payée.
 *
 * Le cas est neuf par sa question : le chapitre juge la campagne entière, depuis zéro, le
 * cas juge les euros ajoutés à une campagne qui existe déjà. Les budgets rejoués sont ceux
 * du chapitre (`communication`, `campagne.ts`).
 */

/**
 * Le budget demandé, en multiple du budget actuel : une fois et demie, la moitié en plus.
 * C'est l'un des paliers que l'arène rejoue (`PALIERS_DE_BUDGET`), et la rallonge qu'une
 * équipe marketing demande couramment pour accélérer.
 */
export const FACTEUR_DE_LA_RALLONGE = 1.5;

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
/** La hausse de budget demandée, en pourcentage du budget actuel. */
const HAUSSE_DU_BUDGET = pct((FACTEUR_DE_LA_RALLONGE - 1) * 100);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function rallongeDeLaCampagne(c: Cas) {
  const k = communication(c);
  const jouee = k.jouee;
  const rallonge = k.budgets.find((b) => b.facteur === FACTEUR_DE_LA_RALLONGE)!;
  const budgetEnPlus = rallonge.budget - jouee.budget;
  const ventesEnPlus = rallonge.commandes - jouee.commandes;
  const margeEnPlus = rallonge.marge - jouee.marge;
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
    // L'erreur classique : compter les ventes depuis le trimestre sans campagne, pas depuis le budget actuel.
    ventesDepuisZero: rallonge.commandes - k.sans.commandes,
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
  entreprises: {
    codes: COMMUNICATIONS,
    pourquoi: "ce cas mesure ce que la publicité fait vendre, et ailleurs l'arène limite déjà les ventes par la production ou décide la publicité produit par produit.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          `« L'équipe marketing me demande une rallonge de ${HAUSSE_DU_BUDGET} : passer de ${eur(r.jouee.budget)} à ${eur(r.rallonge.budget)} de communication par trimestre. Avant d'accepter, je veux savoir ce que ces ${eur(r.budgetEnPlus)} en plus feraient vendre à ${c.entreprise}, et s'ils se paieraient. »`,
          "Pas de cours cette fois : l'arène a rejoué le premier trimestre sans campagne, au budget actuel et au budget demandé. Les calculs sont ceux du chapitre.",
        ];
      },
      tableau: (c) => {
        const r = rallongeDeLaCampagne(c);
        const t = [r.sans, r.jouee, r.rallonge];
        return {
          titre: `Le premier trimestre rejoué · ${c.entreprise}`,
          colonnes: ["Sans campagne", "Budget actuel", "Budget demandé"],
          lignes: [
            { libelle: "Budget de communication", valeurs: t.map((b) => eur(b.budget)) },
            { libelle: `Ventes (${c.unites})`, valeurs: t.map((b) => qte(b.commandes)) },
            { libelle: "Chiffre d'affaires", valeurs: t.map((b) => eur(b.chiffreDAffaires)) },
            { libelle: "Marge sur les ventes", valeurs: t.map((b) => eur(b.marge)) },
          ],
        };
      },
      repere: () =>
        "À rendre : ce que fait la campagne actuelle, les ventes et la marge qu'apporterait la rallonge, ce qu'elle rapporterait une fois payée, et votre réponse.",
    },
    {
      id: "campagne-actuelle",
      type: "montants",
      titre: "Ce que fait la campagne actuelle",
      notions: ["customer_acquisition_cost"],
      question: () =>
        "Comparez le trimestre sans campagne et le trimestre au budget actuel : combien de ventes la campagne actuelle fait-elle gagner, et combien coûte chacune en communication ?",
      champs: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          { libelle: "Ventes gagnées par la campagne actuelle", attendu: r.ventesDeLaCampagne, calcul: `${qte(r.jouee.commandes)} − ${qte(r.sans.commandes)} = ${qte(r.ventesDeLaCampagne)}` },
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
          ? "Comparez maintenant le budget actuel et le budget demandé : le budget en plus, les ventes en plus, puis le coût de chaque vente gagnée par la rallonge."
          : "Comparez maintenant le budget actuel et le budget demandé : le budget en plus, puis les ventes en plus.",
      champs: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          { libelle: "Budget en plus", attendu: r.budgetEnPlus, calcul: `${eur(r.rallonge.budget)} − ${eur(r.jouee.budget)} = ${eur(r.budgetEnPlus)}` },
          { libelle: `Ventes en plus (${c.unites})`, attendu: r.ventesEnPlus, calcul: `${qte(r.rallonge.commandes)} − ${qte(r.jouee.commandes)} = ${qte(r.ventesEnPlus)}` },
          ...(r.coutParVenteEnPlus !== null
            ? [{ libelle: "Coût d'une vente gagnée par la rallonge", attendu: r.coutParVenteEnPlus, tolerance: 0.01, calcul: `${eur(r.budgetEnPlus)} ÷ ${qte(r.ventesEnPlus)} = ${eur(r.coutParVenteEnPlus)}` }]
            : []),
        ];
      },
      explication: (c) => {
        const r = rallongeDeLaCampagne(c);
        return [
          r.coutParVenteEnPlus !== null
            ? `Les euros de la rallonge font vendre moins que les premiers : chaque vente gagnée coûterait ${eur(r.coutParVenteEnPlus)}, contre ${eur(r.coutParVente)} avec la campagne actuelle. La campagne a déjà convaincu les clients les plus faciles.`
            : `Les ventes restent à ${qte(r.jouee.commandes)} : ${c.entreprise} sert déjà tout ce qu'elle peut servir. La rallonge attirerait des clients qui repartiraient sans être servis.`,
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
            : `La marge des ventes en plus ne paie pas la rallonge : ${c.entreprise} perdrait ${eur(-r.gain)} sur le trimestre. Au-delà du budget actuel, un euro de communication ne se paie plus.`,
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
            retour: `Non : chaque euro en plus fait vendre moins que le précédent. La campagne actuelle gagne une vente pour ${eur(r.coutParVente)}, mais la rallonge ${r.coutParVenteEnPlus !== null ? `n'apporterait que ${qte(r.ventesEnPlus)} ${c.unites}, à ${eur(r.coutParVenteEnPlus)} ${accord(c, "chacun")}` : `ne ferait vendre ${aucune} de plus`}.`,
          },
          {
            texte: `La rallonge ferait vendre ${qte(r.ventesDepuisZero)} ${c.unites} de plus`,
            juste: false,
            retour: `Non : ce sont les ventes en plus par rapport au trimestre sans campagne. La rallonge s'ajoute au budget actuel : c'est à lui qu'il faut comparer, et elle ${r.ventesEnPlus > 0 ? `n'apporte que ${qte(r.ventesEnPlus)} ${c.unites}` : `n'apporte ${aucune} de plus`}.`,
          },
          ...(r.ventesEnPlus === 0
            ? [
                {
                  texte: "Oui : plus de publicité fait toujours vendre davantage",
                  juste: false,
                  retour: `Non : au budget demandé, les ventes restent à ${qte(r.jouee.commandes)}. ${c.entreprise} ne peut pas servir plus de clients : la rallonge serait dépensée pour rien.`,
                },
              ]
            : []),
        ];
      },
    },
  ],
};
