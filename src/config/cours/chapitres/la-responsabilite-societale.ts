import type { CompanyRoundResult, RseEngineConfig } from "../../../engine/types";
import { DEFAULT_RSE_CONFIG, evaluateRseCards } from "../../../engine/rse";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { soldUnits } from "../../../engine/simulation/runGame";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CHAPITRE : LA RESPONSABILITÉ SOCIÉTALE, CE QU'ELLE COÛTE, CE QU'ELLE RAPPORTE (stratégie et
 * management, palier 4).
 *
 * L'arène a deux décisions RSE (src/engine/rse) : le budget RSE (`rse.budget`), qui bâtit un
 * capital-image, et l'investissement « process propre » (`rse.investment`), qui bâtit un capital
 * de propreté. Les deux sont des charges du trimestre, décaissées. Ce qu'elles rapportent, le
 * moteur le fait passer par ces capitaux, lents à monter et lents à retomber :
 *
 *   · le capital-image relève l'attractivité de l'offre (donc la demande adressée), à partir du
 *     trimestre suivant ; il ajoute une prime de confiance bancaire (un découvert plus large, à
 *     un taux plus doux) et retient les salariés (le seuil de départ baisse) ;
 *   · le capital de propreté réduit le taux de rebuts, là où l'arène en compte (au bistrot et
 *     chez le marchand en ligne seulement), et, mûr, vaut une éco-subvention ;
 *   · des courriers RSE (le label, le bad buzz, la sanction, l'éco-subvention) tombent selon le
 *     niveau des capitaux, jamais avant un trimestre donné, et jamais chez qui ne s'est pas engagé.
 *
 * Le chapitre ne prête rien d'autre à l'arène : elle n'impose aucune obligation, ne sanctionne
 * pas l'entreprise qui ne fait rien, ne chiffre ni empreinte ni coût évité hors des rebuts.
 *
 * LE BUDGET DU COURS. L'entreprise engage chaque trimestre un budget RSE égal à l'échelle de
 * dépense de son scénario (`marketing.scale`), celle par laquelle le moteur mesure l'effort
 * (`rseEffort` : ln(1 + budget ÷ échelle)) : l'effort vaut alors ln 2, quel que soit le secteur.
 * C'est une hypothèse du cours (`BUDGET_RSE_EN_ECHELLES`), commentée ici, que rien dans l'arène
 * n'impose ; le cas pratique du chapitre en étudie une autre.
 *
 * LE SCÉNARIO REJOUÉ. L'année du cours est jouée dans le scénario du niveau 1 ; la RSE ne s'ouvre
 * qu'au niveau 5 (config/difficulty.ts), mais ce verrou est celui de la feuille de décision et des
 * concurrents pilotés : le moteur honore la décision à tout niveau, dans les neuf entreprises
 * (celles dont le scénario n'a pas de réglages RSE prennent ceux de l'arène par défaut,
 * `DEFAULT_RSE_CONFIG`, comme le moteur). Les réglages RSE des scénarios des niveaux 5 sont les
 * mêmes que ceux de l'année du cours (la garde le vérifie). Le chapitre rejoue donc l'année du
 * cours telle quelle (`rejouerAvec`), avec le seul budget RSE en plus.
 */

/**
 * Le budget RSE du cours, en multiples de l'échelle de dépense du scénario : un, chaque
 * trimestre. Hypothèse du cours : l'effort du moteur vaut alors ln 2 dans tous les secteurs, et
 * la gestion équilibrée de l'arène dépense la moitié de cette échelle en publicité au premier
 * trimestre (le tableau du chapitre le montre).
 */
export const BUDGET_RSE_EN_ECHELLES = 1;

/** Le budget RSE du cours, par trimestre. */
export const budgetRse = (code: string) => Math.round(scenarioByCode(code).scenario.marketing.scale * BUDGET_RSE_EN_ECHELLES);

/** Les réglages RSE que le moteur applique : ceux du scénario, ou ceux de l'arène par défaut. */
export const reglagesRse = (code: string): RseEngineConfig => scenarioByCode(code).scenario.rse ?? DEFAULT_RSE_CONFIG;

/** L'année du cours, le budget RSE du cours engagé chaque trimestre. */
export const anneeEngagee = (code: string) =>
  rejouerAvec(code, "la-responsabilite-societale:budget-chaque-trimestre", (_t, d) => ({ ...d, rse: { ...d.rse, budget: budgetRse(code) } }));

/** L'année du cours, le même montant mis chaque trimestre dans le process propre. */
export const anneeProcessPropre = (code: string) =>
  rejouerAvec(code, "la-responsabilite-societale:process-propre-chaque-trimestre", (_t, d) => ({ ...d, rse: { ...d.rse, investment: budgetRse(code) } }));

/**
 * Les courriers RSE que l'arène aurait pu envoyer dans l'année, tour par tour : tirés, comme le
 * moteur, sur les capitaux d'ouverture, avec le pire tirage (le bad buzz et la sanction tombent
 * dès qu'ils sont possibles). Vide : aucun courrier, ni bon ni mauvais, n'était possible.
 */
export function courriersPossibles(code: string, annee: readonly CompanyRoundResult[]) {
  const reglages = reglagesRse(code);
  const echelle = scenarioByCode(code).scenario.marketing.scale;
  return annee.flatMap((_, k) =>
    evaluateRseCards({
      imageCapital: k === 0 ? 0 : (annee[k - 1]!.rse?.imageCapital ?? 0),
      cleanCapital: k === 0 ? 0 : (annee[k - 1]!.rse?.cleanCapital ?? 0),
      roundIndex: k + 1,
      config: reglages.cards,
      scale: echelle,
      badBuzzRoll: 0,
      sanctionRoll: 0,
    }).map((d) => ({ trimestre: k + 1, code: d.code })),
  );
}

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const dec = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Au centième : le correcteur lit la saisie au centième, comme un montant. */
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const somme = (annee: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => Math.round(surLAnnee(annee, f));
const demande = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.demandForCompany, 0);
const nonQualite = (r: CompanyRoundResult) => (r.qualityCosts?.internalFailure ?? 0) + (r.qualityCosts?.externalFailure ?? 0);

export type VerdictDeLAnnee = "paie-deja" | "pas-encore" | "la-demande-ne-se-vend-pas";
export type VerdictDuLabel = "jamais" | "plus-tard" | "cette-annee";

/** Ce que l'engagement coûte, ce que le moteur en fait, et ce que l'année rejouée en a donné. */
export function engagementRse(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const g = reglagesRse(c.code);
  const echelle = s.marketing.scale;
  const budget = budgetRse(c.code);
  const reference = anneeDeReference(c.code);
  const engagee = anneeEngagee(c.code);
  const k = g.imageInertia;

  // Le capital-image, trimestre après trimestre, à budget constant.
  const effortExact = Math.log(1 + budget / echelle);
  const capitalExact = (n: number) => effortExact * (1 - k ** n);
  const effort = auCentieme(effortExact);
  const capitalT1 = auCentieme(capitalExact(1));
  const capitalT2 = auCentieme(capitalExact(2));
  const capitalFin = auCentieme(capitalExact(engagee.length));
  // Calculée sur le capital arrondi, comme l'élève la calcule.
  const hausseT2 = auDixieme(g.imageDemandSensitivity * capitalT1 * 100);
  const seuil = g.cards.labelImageThreshold;
  const budgetDuLabel = Math.round(echelle * (Math.exp(seuil) - 1));
  // Les trimestres d'engagement qu'il faut pour que le capital passe le seuil, s'il le passe un jour.
  const trimestresDuLabel = effortExact > seuil ? Math.ceil(Math.log(1 - seuil / effortExact) / Math.log(k) - 1e-9) : null;
  const label: VerdictDuLabel = trimestresDuLabel === null ? "jamais" : trimestresDuLabel < engagee.length ? "cette-annee" : "plus-tard";

  // L'année rejouée, avec et sans engagement.
  const lire = (annee: readonly CompanyRoundResult[]) => ({
    demande: somme(annee, demande),
    ventes: somme(annee, soldUnits),
    marge: somme(annee, (r) => r.incomeStatement.grossMargin),
    engagement: somme(annee, (r) => r.incomeStatement.engagementRse ?? 0),
    resultatDExploitation: somme(annee, (r) => r.incomeStatement.operatingIncome),
    resultatNet: somme(annee, (r) => r.incomeStatement.netIncome),
    rebuts: somme(annee, (r) => r.qualityCosts?.defectUnits ?? 0),
    nonQualite: somme(annee, nonQualite),
  });
  const a = lire(reference);
  const b = lire(engagee);
  const cout = b.engagement - a.engagement;
  const margeGagnee = b.marge - a.marge;
  const ecart = b.resultatDExploitation - a.resultatDExploitation;
  const verdict: VerdictDeLAnnee =
    Math.abs(surLAnnee(engagee, soldUnits) - surLAnnee(reference, soldUnits)) < 0.5 ? "la-demande-ne-se-vend-pas" : ecart > 0 ? "paie-deja" : "pas-encore";

  // Le même montant dans le process propre, là où l'arène compte des rebuts.
  const propre = anneeProcessPropre(c.code);
  const p = lire(propre);
  return {
    echelle,
    budget,
    parDefaut: s.rse === undefined,
    publiciteT1: Math.round(reference[0]!.incomeStatement.marketingCost),
    reglages: g,
    effort,
    capitalT1,
    capitalT2,
    capitalFin,
    hausseT2,
    facteurT4: auCentieme(engagee[engagee.length - 1]!.rse!.imageFactor),
    seuil,
    budgetDuLabel,
    trimestresDuLabel,
    label,
    courriers: courriersPossibles(c.code, engagee),
    sans: a,
    avec: b,
    cout,
    demandeGagnee: b.demande - a.demande,
    ventesGagnees: b.ventes - a.ventes,
    margeGagnee,
    ecart,
    resultatNetGagne: b.resultatNet - a.resultatNet,
    verdict,
    aDesRebuts: a.rebuts > 0,
    propre: p,
    rebutsEvites: a.rebuts - p.rebuts,
    nonQualiteEvitee: a.nonQualite - p.nonQualite,
    coutPropre: p.engagement - a.engagement,
    margeGagneePropre: p.marge - a.marge,
    ecartPropre: p.resultatDExploitation - a.resultatDExploitation,
  };
}

/** Les rebuts comptent-ils dans l'arène, chez cette entreprise ? Le process propre n'agit que là. */
export const rebutsComptes = (c: Cas) => engagementRse(c).aDesRebuts;

export const LA_RESPONSABILITE_SOCIETALE: Chapitre = {
  code: "la-responsabilite-societale",
  parcours: "strategie",
  palier: 4,
  blocs: [
    "STMG Thème 3 · Les organisations et la société",
    "DSCG UE3 · Contrôle de gestion et stratégie",
    "BUT GEA · Piloter les relations avec les parties prenantes de l'organisation",
  ],
  titre: "La responsabilité sociétale : ce qu'elle coûte, ce qu'elle rapporte",
  accroche:
    "Un budget RSE se paie chaque trimestre ; ce qu'il rapporte passe par un capital qui met du temps à se bâtir. Ce que le moteur en fait, ce que l'année rejouée en a donné, et la question de fond : contrainte, investissement ou stratégie ?",
  objectifs: [
    "Dire ce que l'arène fait des décisions RSE, et ce qu'elle n'en fait pas",
    "Calculer la construction d'un capital-image et son effet sur l'attractivité",
    "Calculer le budget sous lequel un label ne vient jamais",
    "Mesurer dans l'année rejouée ce que l'engagement coûte et ce qu'il rapporte",
    "Juger la RSE comme une contrainte, un investissement ou une stratégie",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que l'arène appelle RSE",
      notions: ["csr_index", "brand_capital"],
      texte: (c) => {
        const r = engagementRse(c);
        const g = r.reglages;
        return [
          `La direction ${dE(c.entreprise)} envisage de s'engager : ${eur(r.budget)} de budget RSE chaque trimestre de l'année. Dans l'arène, la responsabilité sociétale tient en deux décisions, et toutes deux sont des charges du trimestre, payées tout de suite.`,
          `Le budget RSE bâtit un capital-image. Ce capital relève l'attractivité de l'offre, donc la demande adressée à l'entreprise, à partir du trimestre suivant ; la banque lui fait davantage confiance (un découvert plus large, à un taux plus doux) ; les salariés partent moins vite quand leur salaire glisse sous le marché. L'investissement « process propre » bâtit un autre capital, qui réduit les rebuts${r.aDesRebuts ? "" : `, là où l'arène en compte, ce qui n'est pas le cas chez ${c.entreprise}`}.`,
          `Ces capitaux montent lentement et retombent lentement : chaque trimestre, le capital-image garde ${pct(g.imageInertia * 100)} de ce qu'il était, et l'effort du trimestre fait le reste. Selon leur niveau, l'arène envoie des courriers à partir du trimestre ${g.cards.minRound} : un label quand le capital-image est mûr, un bad buzz ou une sanction quand l'engagement reste tiède. L'entreprise qui ne s'engage pas n'en reçoit aucun : dans l'arène, la RSE n'est pas une obligation.`,
        ];
      },
      tableau: (c) => {
        const r = engagementRse(c);
        const g = r.reglages;
        return {
          titre: `Les réglages RSE de l'arène, chez ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Budget RSE envisagé, par trimestre", valeurs: [eur(r.budget)] },
            { libelle: "Échelle de dépense du scénario", valeurs: [eur(r.echelle)] },
            { libelle: "Budget publicitaire du trimestre 1, pour comparer", valeurs: [eur(r.publiciteT1)] },
            { libelle: "Sensibilité de l'attractivité au capital-image", valeurs: [dec(g.imageDemandSensitivity)] },
            { libelle: "Inertie du capital-image", valeurs: [dec(g.imageInertia)] },
            { libelle: "Seuil du label (capital-image)", valeurs: [dec(g.cards.labelImageThreshold)] },
            { libelle: "Bonus de demande du label", valeurs: [pct(g.cards.labelDemandBonus * 100)] },
            { libelle: "Zone tiède : capital-image sous", valeurs: [dec(g.cards.badBuzzImageCeiling)] },
            { libelle: "Réglages", valeurs: [r.parDefaut ? "ceux de l'arène par défaut" : "propres au scénario"] },
          ],
        };
      },
      repere: () => "Capital du trimestre = inertie × capital du trimestre d'avant + (1 − inertie) × effort, où l'effort vaut ln(1 + budget ÷ échelle).",
    },
    {
      id: "capital",
      type: "montants",
      titre: "Un capital qui se bâtit lentement",
      notions: ["brand_capital"],
      question: (c) => {
        const r = engagementRse(c);
        return `Le capital-image part de zéro. Calculez l'effort d'un trimestre, ln(1 + ${eur(r.budget)} ÷ ${eur(r.echelle)}), puis le capital-image à la fin du trimestre 1 et à la fin du trimestre 2 (au centième), et la hausse d'attractivité que le capital de la fin du trimestre 1 donne au trimestre 2 (la sensibilité × le capital, en %).`;
      },
      champs: (c) => {
        const r = engagementRse(c);
        const g = r.reglages;
        const k = dec(g.imageInertia);
        const reste = dec(1 - g.imageInertia);
        return [
          { libelle: "Effort d'un trimestre", attendu: r.effort, calcul: `ln(1 + ${eur(r.budget)} ÷ ${eur(r.echelle)}) = ${dec(r.effort)}`, tolerance: 0.01 },
          { libelle: "Capital-image à la fin du trimestre 1", attendu: r.capitalT1, calcul: `${k} × 0 + ${reste} × ${dec(r.effort)} = ${dec(r.capitalT1)}`, tolerance: 0.01 },
          {
            libelle: "Capital-image à la fin du trimestre 2",
            attendu: r.capitalT2,
            calcul: `${k} × ${dec(r.capitalT1)} + ${reste} × ${dec(r.effort)} = ${dec(r.capitalT2)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Hausse d'attractivité au trimestre 2 (%)",
            attendu: r.hausseT2,
            calcul: `${dec(g.imageDemandSensitivity)} × ${dec(r.capitalT1)} × 100 = ${pct(r.hausseT2)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const r = engagementRse(c);
        return [
          `Au trimestre 1, l'engagement coûte ${eur(r.budget)} et ne rapporte rien : l'arène lit le capital d'ouverture, encore nul. Au trimestre 2, l'offre ${dE(c.entreprise)} gagne ${pct(r.hausseT2)} d'attractivité ; à la fin de l'année, le capital atteint ${dec(r.capitalFin)}, et l'attractivité du trimestre 4 est multipliée par ${dec(r.facteurT4)}. La publicité agit dans le trimestre et s'éteint ; le capital-image se bâtit, et reste.`,
        ];
      },
    },
    {
      id: "plafond",
      type: "montants",
      titre: "Jusqu'où monte le capital",
      notions: ["brand_capital", "csr_index"],
      question: (c) => {
        const r = engagementRse(c);
        return `À budget constant, le capital-image monte vers l'effort d'un trimestre sans jamais le dépasser. Le label demande un capital de ${dec(r.seuil)}. Calculez le budget par trimestre sous lequel le label ne vient jamais (l'échelle × (e puissance ${dec(r.seuil)} − 1), à l'euro, sans arrondir la puissance), puis le capital-image à la fin de l'année, au budget envisagé (l'effort × (1 − inertie puissance 4), au centième).`;
      },
      champs: (c) => {
        const r = engagementRse(c);
        return [
          {
            libelle: "Budget par trimestre sous lequel le label ne vient jamais",
            attendu: r.budgetDuLabel,
            calcul: `${eur(r.echelle)} × (e puissance ${dec(r.seuil)} − 1) = ${eur(r.budgetDuLabel)}`,
            // Une puissance de e arrondie au millième déplace le budget d'un millième de l'échelle au plus.
            tolerance: Math.max(1, Math.ceil(r.echelle * 0.001)),
          },
          {
            libelle: "Capital-image à la fin de l'année",
            attendu: r.capitalFin,
            calcul: `${dec(r.effort)} × (1 − ${dec(r.reglages.imageInertia)} puissance 4) = ${dec(r.capitalFin)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const r = engagementRse(c);
        return [
          r.budget < r.budgetDuLabel
            ? `${eur(r.budget)} par trimestre, c'est moins que ${eur(r.budgetDuLabel)} : le capital-image tend vers ${dec(r.effort)}, sous le seuil du label.`
            : `${eur(r.budget)} par trimestre, c'est plus que ${eur(r.budgetDuLabel)} : le capital-image tend vers ${dec(r.effort)}, au-dessus du seuil du label, et finit par le passer.`,
          `À la fin de l'année, il en est à ${dec(r.capitalFin)}.`,
        ];
      },
    },
    {
      id: "label",
      type: "choix",
      titre: "Le label viendra-t-il ?",
      notions: ["brand_capital"],
      question: (c) => {
        const r = engagementRse(c);
        return `${c.entreprise} engage ${eur(r.budget)} chaque trimestre, et le label demande un capital-image de ${dec(r.seuil)}. Le label viendra-t-il ?`;
      },
      options: (c) => {
        const r = engagementRse(c);
        return [
          {
            texte: "Jamais à ce budget : le capital plafonne sous le seuil du label",
            juste: r.label === "jamais",
            retour:
              r.label === "jamais"
                ? `Oui : à ${eur(r.budget)} par trimestre, le capital tend vers ${dec(r.effort)} et ne passe jamais ${dec(r.seuil)}. Il faudrait plus de ${eur(r.budgetDuLabel)} par trimestre, longtemps.`
                : `Non : le capital tend vers ${dec(r.effort)}, au-dessus du seuil de ${dec(r.seuil)}.`,
          },
          {
            texte: "Oui, mais pas cette année : le capital passera le seuil plus tard",
            juste: r.label === "plus-tard",
            retour:
              r.label === "plus-tard"
                ? `Oui : le capital tend vers ${dec(r.effort)}, au-dessus de ${dec(r.seuil)}, mais il lui faut ${r.trimestresDuLabel} trimestres d'engagement pour passer le seuil. L'année n'y suffit pas.`
                : r.label === "jamais"
                  ? `Non : le capital tend vers ${dec(r.effort)}, sous le seuil de ${dec(r.seuil)}. Il ne le passera jamais à ce budget.`
                  : "Non : le capital passe le seuil dès cette année.",
          },
          {
            texte: "Dès cette année : le capital passe le seuil avant le dernier trimestre",
            juste: r.label === "cette-annee",
            retour:
              r.label === "cette-annee"
                ? `Oui : il faut ${r.trimestresDuLabel} trimestres d'engagement pour passer le seuil.`
                : `Non : à la fin de l'année, le capital n'en est qu'à ${dec(r.capitalFin)}, sous le seuil de ${dec(r.seuil)}.`,
          },
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année engagée",
      notions: ["csr_index", "contribution_margin"],
      tableau: (c) => {
        const r = engagementRse(c);
        return {
          titre: "L'année jouée, sans et avec l'engagement",
          colonnes: ["Sans engagement", "Avec l'engagement"],
          lignes: [
            { libelle: `Demande adressée sur l'année (${c.unites})`, valeurs: [qte(r.sans.demande), qte(r.avec.demande)] },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(r.sans.ventes), qte(r.avec.ventes)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(r.sans.marge), eur(r.avec.marge)] },
            { libelle: "Engagement RSE", valeurs: [eur(r.sans.engagement), eur(r.avec.engagement)] },
            { libelle: "Résultat d'exploitation", valeurs: [eur(r.sans.resultatDExploitation), eur(r.avec.resultatDExploitation)] },
          ],
        };
      },
      question: () =>
        "L'arène a rejoué l'année avec l'engagement, tout le reste identique. Calculez ce que l'engagement a coûté sur l'année, la marge sur coût variable gagnée, et l'écart de résultat d'exploitation.",
      champs: (c) => {
        const r = engagementRse(c);
        return [
          { libelle: "Coût de l'engagement sur l'année", attendu: r.cout, calcul: `${eur(r.avec.engagement)} − ${eur(r.sans.engagement)} = ${eur(r.cout)}`, tolerance: 1 },
          { libelle: "Marge gagnée sur l'année", attendu: r.margeGagnee, calcul: `${eur(r.avec.marge)} − ${retranche(r.sans.marge)} = ${eur(r.margeGagnee)}`, tolerance: 1 },
          {
            libelle: "Écart de résultat d'exploitation",
            attendu: r.ecart,
            calcul: `${eur(r.avec.resultatDExploitation)} − ${retranche(r.sans.resultatDExploitation)} = ${eur(r.ecart)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = engagementRse(c);
        return [
          `La demande adressée à ${c.entreprise} monte de ${qte(r.demandeGagnee)} ${c.unites} sur l'année. ${
            r.verdict === "la-demande-ne-se-vend-pas"
              ? "Mais les ventes ne bougent pas : l'entreprise ne sert pas plus de clients qu'avant, et la demande gagnée se perd."
              : `Les ventes, elles, montent de ${qte(r.ventesGagnees)} : seule la demande servie rapporte.`
          }`,
          `L'écart de résultat, ${eur(r.ecart)}, est la marge gagnée moins le coût de l'engagement : dans l'arène, rien d'autre n'a changé. Aucun courrier RSE n'est tombé : le capital-image avait quitté la zone tiède quand l'arène a commencé à en envoyer, et il est resté sous le seuil du label.`,
        ];
      },
    },
    {
      id: "process-propre",
      type: "montants",
      titre: "Le process propre et les rebuts",
      notions: ["csr_index", "variable_costs"],
      si: rebutsComptes,
      tableau: (c) => {
        const r = engagementRse(c);
        return {
          titre: `L'année jouée, ${eur(r.budget)} par trimestre dans le process propre`,
          colonnes: ["Sans engagement", "Avec le process propre"],
          lignes: [
            { libelle: `Rebuts de l'année (${c.unites})`, valeurs: [qte(r.sans.rebuts), qte(r.propre.rebuts)] },
            { libelle: "Coût de la non-qualité", valeurs: [eur(r.sans.nonQualite), eur(r.propre.nonQualite)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(r.sans.marge), eur(r.propre.marge)] },
            { libelle: "Engagement RSE", valeurs: [eur(r.sans.engagement), eur(r.propre.engagement)] },
            { libelle: "Résultat d'exploitation", valeurs: [eur(r.sans.resultatDExploitation), eur(r.propre.resultatDExploitation)] },
          ],
        };
      },
      question: (c) =>
        `Chez ${c.entreprise}, l'arène compte des rebuts. Elle a rejoué l'année avec le même montant mis chaque trimestre dans le process propre plutôt que dans le budget RSE. Calculez les rebuts évités sur l'année (en ${c.unites}), le coût de la non-qualité évité, et l'écart de résultat d'exploitation.`,
      champs: (c) => {
        const r = engagementRse(c);
        return [
          { libelle: `Rebuts évités (${c.unites})`, attendu: r.rebutsEvites, calcul: `${qte(r.sans.rebuts)} − ${qte(r.propre.rebuts)} = ${qte(r.rebutsEvites)}`, tolerance: 1 },
          {
            libelle: "Coût de la non-qualité évité",
            attendu: r.nonQualiteEvitee,
            calcul: `${eur(r.sans.nonQualite)} − ${eur(r.propre.nonQualite)} = ${eur(r.nonQualiteEvitee)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de résultat avec le process propre",
            attendu: r.ecartPropre,
            calcul: `${eur(r.propre.resultatDExploitation)} − ${retranche(r.sans.resultatDExploitation)} = ${eur(r.ecartPropre)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = engagementRse(c);
        return [
          `Le process propre évite ${eur(r.nonQualiteEvitee)} de non-qualité sur l'année, pour ${eur(r.coutPropre)} d'engagement : ${r.ecartPropre > 0 ? "il paie déjà" : "il ne paie pas dans l'année"}. Comme le capital-image, son capital se bâtit lentement, et la réduction des rebuts ne joue qu'à partir du trimestre suivant.`,
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "L'engagement de l'année a-t-il payé ?",
      notions: ["csr_index", "brand_capital"],
      question: (c) => {
        const r = engagementRse(c);
        return `Sur l'année, l'engagement coûte ${eur(r.cout)} à ${c.entreprise}, et le résultat d'exploitation change de ${eur(r.ecart)}. Que retenir ?`;
      },
      options: (c) => {
        const r = engagementRse(c);
        return [
          {
            texte: "Il paie déjà : la marge gagnée dépasse son coût dès la première année",
            juste: r.verdict === "paie-deja",
            retour:
              r.verdict === "paie-deja"
                ? `Oui : la marge gagnée, ${eur(r.margeGagnee)}, dépasse les ${eur(r.cout)} de l'engagement, et le résultat monte de ${eur(r.ecart)}. Chez ${c.entreprise}, la demande gagnée se vend, et l'attractivité gagnée suffit dès cette année.`
                : `Non : le résultat ${r.ecart < 0 ? `baisse de ${eur(-r.ecart)}` : "ne monte pas"}.`,
          },
          {
            texte: "Pas encore : la demande gagnée se vend, mais pas assez pour payer l'année",
            juste: r.verdict === "pas-encore",
            retour:
              r.verdict === "pas-encore"
                ? `Oui : ${c.entreprise} vend ${qte(r.ventesGagnees)} ${c.unites} de plus, mais la marge gagnée (${eur(r.margeGagnee)}) reste sous le coût de l'engagement (${eur(r.cout)}). Le capital bâti cette année reste au début de l'année suivante : c'est sur plusieurs années que l'engagement se juge.`
                : r.verdict === "paie-deja"
                  ? `Non : la marge gagnée dépasse déjà le coût, et le résultat monte de ${eur(r.ecart)}.`
                  : "Non : les ventes n'ont pas bougé du tout.",
          },
          {
            texte: "La demande gagnée ne se vend pas : l'entreprise ne sert pas plus de clients",
            juste: r.verdict === "la-demande-ne-se-vend-pas",
            retour:
              r.verdict === "la-demande-ne-se-vend-pas"
                ? `Oui : la demande adressée monte de ${qte(r.demandeGagnee)} ${c.unites}, mais les ventes ne bougent pas. Un engagement qui attire des clients ne paie que si l'entreprise peut les servir : l'année coûte ${eur(r.cout)}, pour rien en retour.`
                : `Non : les ventes montent de ${qte(r.ventesGagnees)} ${c.unites}.`,
          },
        ];
      },
    },
    {
      id: "de-fond",
      type: "choix",
      titre: "Contrainte, investissement ou stratégie ?",
      notions: ["csr_index", "brand_capital"],
      question: () => "Dans l'arène, qu'est-ce que l'engagement RSE ?",
      options: (c) => {
        const r = engagementRse(c);
        return [
          {
            texte: "Une contrainte : l'arène sanctionne l'entreprise qui ne s'engage pas",
            juste: false,
            retour:
              "Non : un capital nul ne déclenche aucun courrier, ni label ni sanction. Dans l'arène, la sanction ne menace que l'engagement tiède, pas l'absence d'engagement : la RSE y est un choix.",
          },
          {
            texte: "Un investissement : un capital payé maintenant, qui rapporte ensuite",
            juste: true,
            retour: `Oui : la dépense est une charge du trimestre, et elle bâtit un capital qui relève l'attractivité les trimestres suivants. Le capital garde ${pct(r.reglages.imageInertia * 100)} de lui-même chaque trimestre : il s'use lentement si l'on arrête. Devenu assez fort pour le label, il devient un avantage durable, une stratégie de différenciation.`,
          },
          {
            texte: "Une publicité : elle fait vendre dans le trimestre, puis son effet s'éteint",
            juste: false,
            retour: `Non : l'engagement du trimestre ne rapporte rien dans le trimestre même ; il joue à partir du suivant, et dure. C'est l'inverse de la publicité, qui agit tout de suite et s'éteint vite.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["csr_index", "brand_capital"],
      texte: (c) => {
        const r = engagementRse(c);
        return [
          `Chez ${c.entreprise}, ${eur(r.budget)} de budget RSE par trimestre coûtent ${eur(r.cout)} sur l'année, et le résultat d'exploitation change de ${eur(r.ecart)}. Le capital-image finit l'année à ${dec(r.capitalFin)} ; le label demande ${dec(r.seuil)}.`,
          "La responsabilité sociétale se paie tout de suite et rapporte plus tard. Prise trimestre par trimestre, elle ressemble à une charge ; tenue plusieurs années, elle bâtit un capital qui attire les clients, rassure la banque et retient les salariés. C'est ce qui en fait une stratégie : un engagement constant et assez fort, pas un geste d'un trimestre. Tiède, il expose au bad buzz et à la sanction sans rapporter le label.",
        ];
      },
      repere: () => "Capital à budget constant, après n trimestres = effort × (1 − inertie puissance n) ; il tend vers l'effort, sans le dépasser.",
    },
  ],
};
