import type { CompanyRoundResult } from "../../../../engine/types";
import { RSE_CARD_CODES } from "../../../../engine/rse";
import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { soldUnits } from "../../../../engine/simulation/runGame";
import { scenarioByCode } from "../../../scenarios/registry";
import type { Cas } from "../../cas";
import {
  LA_RESPONSABILITE_SOCIETALE,
  anneeEngagee,
  budgetRse,
  courriersPossibles,
  reglagesRse,
} from "../../chapitres/la-responsabilite-societale";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CAS PRATIQUE DU CHAPITRE « LA RESPONSABILITÉ SOCIÉTALE » : VISER LE LABEL (stratégie et
 * management, palier 4).
 *
 * Le chapitre a montré qu'au budget du cours le label ne vient pas dans l'année. La direction le
 * veut avant la fin de l'année : elle propose le budget RSE qui fait passer le seuil du label au
 * capital-image en trois trimestres, pour que l'arène l'accorde au quatrième. L'élève vérifie le
 * calcul du capital, chiffre ce que l'année coûtera, puis lit ce que l'arène en fait, face au
 * budget du chapitre.
 *
 * Le cas est neuf par sa question : le chapitre suivait un budget donné, le cas part d'un objectif
 * (le label à une date) pour trouver le budget, et pèse ce que l'objectif rapporte de plus. Le
 * capital se calcule comme dans le chapitre (src/engine/rse : `rseEffort`, `updateRseCapital`) ;
 * le label est le courrier du moteur (`evaluateRseCards`), accordé sur le capital d'ouverture du
 * trimestre ; l'année est l'année du cours rejouée (`rejouerAvec`).
 */

/** Le label se vise au trimestre 4 : le capital doit passer son seuil à la fin du trimestre 3. */
export const TRIMESTRES_AVANT_LE_LABEL = 3;

/**
 * Le budget de la direction : le plus petit, à la centaine d'euros supérieure, qui porte le
 * capital-image au seuil du label en trois trimestres, à budget constant. Le capital après n
 * trimestres vaut effort × (1 − inertie puissance n) : il faut un effort d'au moins seuil ÷ (1 −
 * inertie puissance 3), soit un budget de l'échelle × (e puissance cet effort − 1).
 */
export function budgetDuLabel(code: string): number {
  const g = reglagesRse(code);
  const echelle = scenarioByCode(code).scenario.marketing.scale;
  const effort = g.cards.labelImageThreshold / (1 - g.imageInertia ** TRIMESTRES_AVANT_LE_LABEL);
  return Math.ceil((echelle * (Math.exp(effort) - 1)) / 100) * 100;
}

/** L'année du cours, le budget de la direction engagé chaque trimestre. */
export const anneeVersLeLabel = (code: string) =>
  rejouerAvec(code, "la-responsabilite-societale:vers-le-label", (_t, d) => ({ ...d, rse: { ...d.rse, budget: budgetDuLabel(code) } }));

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const dec = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Au centième : le correcteur lit la saisie au centième, comme un montant. */
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const somme = (annee: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => Math.round(surLAnnee(annee, f));
const demande = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.demandForCompany, 0);

export type Verdict = "viser-le-label" | "pas-cette-annee";

/** Le budget du label, le capital qu'il bâtit, et ce que l'arène fait de l'année. */
export function viserLeLabel(c: Cas) {
  const g = reglagesRse(c.code);
  const echelle = scenarioByCode(c.code).scenario.marketing.scale;
  const budget = budgetDuLabel(c.code);
  const effortExact = Math.log(1 + budget / echelle);
  const k = g.imageInertia;
  const lire = (annee: readonly CompanyRoundResult[]) => ({
    demandeT4: Math.round(demande(annee[annee.length - 1]!)),
    ventes: somme(annee, soldUnits),
    marge: somme(annee, (r) => r.incomeStatement.grossMargin),
    engagement: somme(annee, (r) => r.incomeStatement.engagementRse ?? 0),
    resultatDExploitation: somme(annee, (r) => r.incomeStatement.operatingIncome),
  });
  const vers = anneeVersLeLabel(c.code);
  const sans = lire(anneeDeReference(c.code));
  const chapitre = lire(anneeEngagee(c.code));
  const label = lire(vers);
  const ecartAuSans = label.resultatDExploitation - sans.resultatDExploitation;
  const ecartAuChapitre = label.resultatDExploitation - chapitre.resultatDExploitation;
  return {
    echelle,
    budget,
    budgetDuChapitre: budgetRse(c.code),
    reglages: g,
    effort: auCentieme(effortExact),
    capitalT3: auCentieme(effortExact * (1 - k ** TRIMESTRES_AVANT_LE_LABEL)),
    cout: budget * vers.length,
    trimestres: vers.length,
    courriers: courriersPossibles(c.code, vers),
    labelAuTrimestre: courriersPossibles(c.code, vers).find((x) => x.code === RSE_CARD_CODES.label)?.trimestre ?? null,
    sans,
    chapitre,
    label,
    ecartAuSans,
    ecartAuChapitre,
    verdict: (ecartAuChapitre > 0 ? "viser-le-label" : "pas-cette-annee") as Verdict,
  };
}

export const VISER_LE_LABEL: Situation = {
  code: "viser-le-label",
  parcours: "strategie",
  palier: 4,
  blocs: [],
  reprend: [LA_RESPONSABILITE_SOCIETALE.code],
  commanditaire: "La direction",
  titre: "Viser le label",
  accroche:
    "La direction veut le label RSE avant la fin de l'année, et propose le budget qui l'y mène. Le capital qu'il bâtit, ce que l'année coûte, et ce que l'arène en fait face au budget du chapitre.",
  objectifs: [
    "Calculer le capital-image qu'un budget RSE bâtit en trois trimestres",
    "Chiffrer le coût d'un engagement sur l'année",
    "Comparer deux budgets RSE dans l'année rejouée",
    "Répondre à la direction, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const v = viserLeLabel(c);
        return [
          `« Le label RSE, je le veux avant la fin de l'année : c'est ce qui distinguera ${c.entreprise} de ses concurrents. Je propose ${eur(v.budget)} de budget RSE chaque trimestre, au lieu de ${eur(v.budgetDuChapitre)}. Vérifiez que le capital-image passera le seuil du label en ${TRIMESTRES_AVANT_LE_LABEL} trimestres, dites-moi ce que l'année coûtera, et si cela vaut mieux que le budget de départ. »`,
          "Pas de cours cette fois : vous avez les réglages RSE de l'arène, et le calcul du capital est celui du chapitre. L'arène a rejoué l'année avec chacun des deux budgets.",
        ];
      },
      tableau: (c) => {
        const v = viserLeLabel(c);
        const g = v.reglages;
        return {
          titre: `Les réglages RSE de l'arène, chez ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Budget RSE proposé, par trimestre", valeurs: [eur(v.budget)] },
            { libelle: "Budget RSE de départ, par trimestre", valeurs: [eur(v.budgetDuChapitre)] },
            { libelle: "Échelle de dépense du scénario", valeurs: [eur(v.echelle)] },
            { libelle: "Inertie du capital-image", valeurs: [dec(g.imageInertia)] },
            { libelle: "Seuil du label (capital-image)", valeurs: [dec(g.cards.labelImageThreshold)] },
            { libelle: "Bonus de demande du label", valeurs: [pct(g.cards.labelDemandBonus * 100)] },
            { libelle: "Durée du label (trimestres)", valeurs: [qte(g.cards.labelDuration)] },
          ],
        };
      },
      repere: () => "À rendre : le capital à la fin du trimestre 3, le coût de l'année, ce que l'arène en fait, et votre réponse.",
    },
    {
      id: "capital",
      type: "montants",
      titre: "Le capital passera-t-il le seuil ?",
      notions: ["brand_capital", "csr_index"],
      question: (c) => {
        const v = viserLeLabel(c);
        return `Le capital-image part de zéro. Calculez l'effort d'un trimestre au budget proposé, ln(1 + ${eur(v.budget)} ÷ ${eur(v.echelle)}), au centième, puis le capital-image à la fin du trimestre ${TRIMESTRES_AVANT_LE_LABEL}, au centième, et le coût de l'engagement sur l'année.`;
      },
      champs: (c) => {
        const v = viserLeLabel(c);
        const k = dec(v.reglages.imageInertia);
        return [
          { libelle: "Effort d'un trimestre", attendu: v.effort, calcul: `ln(1 + ${eur(v.budget)} ÷ ${eur(v.echelle)}) = ${dec(v.effort)}`, tolerance: 0.01 },
          {
            libelle: `Capital-image à la fin du trimestre ${TRIMESTRES_AVANT_LE_LABEL}`,
            attendu: v.capitalT3,
            calcul: `${dec(v.effort)} × (1 − ${k} puissance ${TRIMESTRES_AVANT_LE_LABEL}) = ${dec(v.capitalT3)}`,
            tolerance: 0.01,
          },
          { libelle: "Coût de l'engagement sur l'année", attendu: v.cout, calcul: `${eur(v.budget)} × ${v.trimestres} = ${eur(v.cout)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const v = viserLeLabel(c);
        return [
          `${dec(v.capitalT3)} à la fin du trimestre ${TRIMESTRES_AVANT_LE_LABEL}, pour un seuil de ${dec(v.reglages.cards.labelImageThreshold)} : l'arène accorde le label au trimestre ${v.labelAuTrimestre}, sur le capital d'ouverture, avec ${pct(v.reglages.cards.labelDemandBonus * 100)} de demande en plus. L'année coûte ${eur(v.cout - v.budgetDuChapitre * v.trimestres)} de plus qu'au budget de départ.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année avec chaque budget",
      notions: ["csr_index", "contribution_margin"],
      tableau: (c) => {
        const v = viserLeLabel(c);
        return {
          titre: "L'année jouée, sans engagement, au budget de départ, au budget du label",
          colonnes: ["Sans engagement", "Budget de départ", "Budget du label"],
          lignes: [
            { libelle: `Demande adressée au trimestre 4 (${c.unites})`, valeurs: [qte(v.sans.demandeT4), qte(v.chapitre.demandeT4), qte(v.label.demandeT4)] },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(v.sans.ventes), qte(v.chapitre.ventes), qte(v.label.ventes)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(v.sans.marge), eur(v.chapitre.marge), eur(v.label.marge)] },
            { libelle: "Engagement RSE", valeurs: [eur(v.sans.engagement), eur(v.chapitre.engagement), eur(v.label.engagement)] },
            {
              libelle: "Résultat d'exploitation",
              valeurs: [eur(v.sans.resultatDExploitation), eur(v.chapitre.resultatDExploitation), eur(v.label.resultatDExploitation)],
            },
          ],
        };
      },
      question: () =>
        "D'après le tableau, calculez l'écart de résultat d'exploitation entre le budget du label et l'année sans engagement, puis entre le budget du label et le budget de départ.",
      champs: (c) => {
        const v = viserLeLabel(c);
        return [
          {
            libelle: "Écart de résultat, label contre sans engagement",
            attendu: v.ecartAuSans,
            calcul: `${eur(v.label.resultatDExploitation)} − ${retranche(v.sans.resultatDExploitation)} = ${eur(v.ecartAuSans)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de résultat, label contre budget de départ",
            attendu: v.ecartAuChapitre,
            calcul: `${eur(v.label.resultatDExploitation)} − ${retranche(v.chapitre.resultatDExploitation)} = ${eur(v.ecartAuChapitre)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const v = viserLeLabel(c);
        return [
          `Au trimestre 4, avec le label, la demande adressée à ${c.entreprise} atteint ${qte(v.label.demandeT4)} ${c.unites}, contre ${qte(v.chapitre.demandeT4)} au budget de départ. ${
            v.ecartAuChapitre > 0
              ? `L'année finit mieux de ${eur(v.ecartAuChapitre)} qu'au budget de départ : la marge gagnée paie le budget en plus.`
              : v.label.ventes <= v.chapitre.ventes
                ? `L'année finit moins bien de ${eur(-v.ecartAuChapitre)} qu'au budget de départ : la demande en plus n'est pas servie, les ventes ne montent pas, et le budget en plus ne rapporte rien cette année.`
                : `L'année finit moins bien de ${eur(-v.ecartAuChapitre)} qu'au budget de départ : le label n'arrive qu'au dernier trimestre, trop tard pour payer, cette année, le budget en plus des trois premiers.`
          }`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const v = viserLeLabel(c);
        return [
          {
            texte: "Visons le label : l'année finit mieux qu'au budget de départ",
            juste: v.verdict === "viser-le-label",
            retour:
              v.verdict === "viser-le-label"
                ? `Oui : dans l'arène, le label arrive au trimestre ${v.labelAuTrimestre}, et le résultat d'exploitation de l'année finit ${eur(v.ecartAuChapitre)} au-dessus du budget de départ. Le label dure ${v.reglages.cards.labelDuration} trimestres, et se renouvelle tant que le capital reste au-dessus du seuil.`
                : `Non : l'année finit ${eur(-v.ecartAuChapitre)} en dessous du budget de départ.`,
          },
          {
            texte: "Pas cette année : le label coûte plus qu'il ne rapporte",
            juste: v.verdict === "pas-cette-annee",
            retour:
              v.verdict === "pas-cette-annee"
                ? `Oui : le label arrive au trimestre ${v.labelAuTrimestre}, mais le résultat d'exploitation finit ${eur(-v.ecartAuChapitre)} en dessous du budget de départ. Le label n'est pas perdu pour autant : il joue encore au début de l'année suivante, et c'est sur plusieurs années qu'il se juge.`
                : `Non : l'année finit mieux de ${eur(v.ecartAuChapitre)} qu'au budget de départ.`,
          },
          {
            texte: "Inutile de payer plus : le budget de départ donne déjà le label",
            juste: false,
            retour: "Non : au budget de départ, le capital-image reste sous le seuil du label toute l'année.",
          },
        ];
      },
    },
  ],
};
