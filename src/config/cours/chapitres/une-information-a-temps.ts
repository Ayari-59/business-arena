import type { CompanyRoundResult, RoundDecisions } from "../../../engine/types";
import { soldUnits } from "../../../engine/simulation/runGame";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../scenarios/registry";
import { accordPluriel } from "../accords";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec, type Changement } from "../gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : UNE INFORMATION QUI CIRCULE À TEMPS (Bac STMG, management, palier 1).
 *
 * Ce que vaut, dans une équipe, une information à jour. Ceux qui vendent voient les premiers ce
 * qui se vend et les clients qui repartent sans être servis ; ceux qui fixent la production et le
 * prix décident sur ces chiffres. Le chapitre rejoue l'année du cours avec une équipe où ces
 * chiffres arrivent en retard, et l'élève mesure ce que le retard coûte.
 *
 * CE QUE LE COURS POSE, nommé ci-dessous : LE RETARD. Les chiffres des ventes arrivent avec un
 * trimestre de retard (`RETARD`), puis deux (`RETARD_LONG`), et l'équipe joue alors la décision de
 * production et de prix qu'elle aurait prise sur ces chiffres, sans la corriger. L'arène ne simule
 * pas la circulation de l'information dans une équipe : c'est l'hypothèse du cours, dite à l'élève.
 *
 * CE QUE L'ARÈNE CALCULE : l'année du cours (`anneeDeReference`, l'équipe à jour : le bon
 * gestionnaire décide chaque trimestre sur les chiffres du trimestre qui vient de finir), et les
 * années rejouées (`rejouerAvec`). Le `change` garde chaque trimestre la décision que le bon
 * gestionnaire propose, et joue au trimestre t le plan et le prix qu'il proposait au trimestre
 * t − RETARD : une décision prise sur les chiffres de t − 1 − RETARD. Le premier trimestre garde
 * la décision du départ, faute de chiffre arrivé. Le reste de la décision (l'équipe et ses
 * embauches, la qualité, l'entretien, la publicité, les créances) est celui que le bon
 * gestionnaire propose au trimestre même : seuls les chiffres des ventes arrivent en retard. La
 * décision rejouée est une valeur posée, pas un facteur : rien ne se compose d'un trimestre à
 * l'autre (la garde vérifie le plan et le prix joués à chaque trimestre).
 *
 * L'angle n'est ni celui de « Ce que coûte et rapporte un outil numérique » (le coût d'un logiciel
 * et ce qu'il rapporte selon l'usage), ni celui de « Une donnée fausse, une décision fausse »
 * (une erreur de saisie et le contrôle qui l'arrête) : ici, une donnée juste, mais qui arrive trop
 * tard à ceux qui décident.
 *
 * VOLT FITNESS N'EN EST PAS : elle vend des abonnements, ses adhérents restent d'un trimestre à
 * l'autre, et aucun client n'y repart sans être servi, à jour comme en retard (la garde le
 * recompte sur le moteur). Le retard n'y change que le rythme de ses hausses de prix.
 */

/** LE RETARD DU COURS : les chiffres des ventes arrivent avec un trimestre de retard. Hypothèse du cours. */
export const RETARD = 1;

/** LE RETARD PLUS LONG, comparé au premier : deux trimestres. Hypothèse du cours. */
export const RETARD_LONG = 2;

/** Le premier trimestre de l'année : sa décision reste celle du départ, aucun chiffre n'est encore arrivé. */
export const TRIMESTRE_DE_DEPART = 1;

/** Le trimestre de la question « sur quels chiffres l'équipe décide-t-elle ? ». */
export const TRIMESTRE_DE_LA_QUESTION = 3;

/** Les trimestres de l'année. */
const TRIMESTRES = [1, 2, 3, 4] as const;

/** Les entreprises du chapitre : toutes, sauf celle qui vend des abonnements. */
export const ENTREPRISES_DE_L_INFORMATION: readonly string[] = ENTREPRISES_DU_COURS.filter((code) => !scenarioByCode(code).scenario.subscription);

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
/** « de » devant un nom : élidé devant une voyelle, contracté devant l'article. */
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

/** Un retard écrit en chiffres : « 1 trimestre de retard », « 2 trimestres de retard ». */
export const retardEcrit = (n: number) => `${n} trimestre${n > 1 ? "s" : ""} de retard`;

const R1 = retardEcrit(RETARD);
const R2 = retardEcrit(RETARD_LONG);
const SOURCE_DE_LA_QUESTION = TRIMESTRE_DE_LA_QUESTION - 1 - RETARD;
const DERNIER = TRIMESTRES[TRIMESTRES.length - 1]!;

/** La demande que l'entreprise n'a pas servie dans le trimestre : des clients repartis sans acheter. */
const nonServie = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0);

/**
 * LA DÉCISION EN RETARD : le plan et le prix que le bon gestionnaire proposait `retard` trimestres
 * plus tôt, le reste de la décision du trimestre même. Chaque appel donne une mémoire neuve.
 */
export function decisionEnRetard(retard: number): Changement {
  const proposees: RoundDecisions[] = [];
  return (tour, d) => {
    proposees[tour] = structuredClone(d);
    const source = Math.max(TRIMESTRE_DE_DEPART, tour - retard);
    if (source === tour) return undefined;
    const p = proposees[source]!;
    return {
      ...d,
      productionPlan: p.productionPlan,
      price: p.price,
      ...(d.products && p.products
        ? {
            products: Object.fromEntries(
              Object.entries(d.products).map(([k, x]) => {
                const avant = p.products![k];
                return [k, avant ? { ...x, productionPlan: avant.productionPlan, price: avant.price } : x];
              }),
            ),
          }
        : {}),
    };
  };
}

/** L'année du cours rejouée avec les chiffres des ventes en retard de `retard` trimestres. */
export const anneeEnRetard = (code: string, retard: number) =>
  rejouerAvec(code, `une-information-a-temps:retard-${retard}`, decisionEnRetard(retard));

export interface TrimestreDeLEquipe {
  trimestre: number;
  /** Ce que l'équipe a prévu de produire (ou d'offrir), à l'unité. */
  plan: number;
  produit: number;
  ventes: number;
  /** La demande que l'entreprise n'a pas servie : des clients repartis sans acheter. */
  nonServie: number;
  /** Ce qui a été produit (ou offert) et ne s'est pas vendu dans le trimestre. */
  invendu: number;
  resultat: number;
}

export interface AnneeDeLEquipe {
  trimestres: TrimestreDeLEquipe[];
  ventes: number;
  nonServie: number;
  /** La valeur du stock qui reste au bilan de fin d'année. */
  stockFinal: number;
  chiffreDAffaires: number;
  resultat: number;
  /** Aucune défaillance dans l'année : les quatre trimestres sont joués. */
  complete: boolean;
}

/** Une année jouée, arrondie à l'unité et à l'euro, tranchée à la défaillance s'il y en a une. */
export function anneeDeLEquipe(annee: readonly CompanyRoundResult[]): AnneeDeLEquipe {
  const fin = annee.findIndex((r) => r.defaillant);
  const jouee = fin < 0 ? annee : annee.slice(0, fin + 1);
  const somme = (f: (r: CompanyRoundResult) => number) => Math.round(jouee.reduce((t, r) => t + f(r), 0));
  return {
    trimestres: jouee.map((r, i) => {
      const produit = Math.round(r.production.produced);
      const ventes = Math.round(soldUnits(r));
      return {
        trimestre: i + 1,
        plan: Math.round(r.production.planned),
        produit,
        ventes,
        nonServie: Math.round(nonServie(r)),
        invendu: Math.max(0, produit - ventes),
        resultat: Math.round(r.incomeStatement.operatingIncome),
      };
    }),
    ventes: somme(soldUnits),
    nonServie: somme(nonServie),
    stockFinal: Math.round(jouee.at(-1)!.balanceSheet.inventoryValue),
    chiffreDAffaires: somme((r) => r.incomeStatement.revenue),
    resultat: somme((r) => r.incomeStatement.operatingIncome),
    complete: jouee.length === annee.length,
  };
}

export type SensDuPlan = "trop-bas" | "trop-haut" | "egal";
export type VerdictDuRetardLong = "au-moins-le-double" | "plus-mais-moins-du-double" | "moins";

/** L'année à jour, les deux années en retard, et ce que chaque retard coûte. */
export function informationATemps(c: Cas) {
  const s = scenarioByCode(c.code);
  const aJour = anneeDeLEquipe(anneeDeReference(c.code));
  const enRetard = anneeDeLEquipe(anneeEnRetard(c.code, RETARD));
  const long = anneeDeLEquipe(anneeEnRetard(c.code, RETARD_LONG));
  // L'écart de plan de chaque trimestre : joué en retard, moins à jour.
  const ecarts = TRIMESTRES.map((t) => ({ trimestre: t, ecart: enRetard.trimestres[t - 1]!.plan - aJour.trimestres[t - 1]!.plan }));
  const apresLeDepart = ecarts.filter((e) => e.trimestre > TRIMESTRE_DE_DEPART);
  const plusGrand = Math.max(...apresLeDepart.map((e) => Math.abs(e.ecart)));
  const plusTouche = apresLeDepart.find((e) => Math.abs(e.ecart) === plusGrand)!;
  const sens: SensDuPlan = plusTouche.ecart < 0 ? "trop-bas" : plusTouche.ecart > 0 ? "trop-haut" : "egal";
  const coutDuRetard = aJour.resultat - enRetard.resultat;
  const coutDuRetardLong = aJour.resultat - long.resultat;
  const verdict: VerdictDuRetardLong =
    coutDuRetardLong >= 2 * coutDuRetard ? "au-moins-le-double" : coutDuRetardLong >= coutDuRetard ? "plus-mais-moins-du-double" : "moins";
  return {
    libellePlan: s.vocabulary.productionPlanLabel,
    perissable: s.scenario.perishable === true,
    aJour,
    enRetard,
    long,
    ecarts,
    plusTouche: { ...plusTouche, aJour: aJour.trimestres[plusTouche.trimestre - 1]!, enRetard: enRetard.trimestres[plusTouche.trimestre - 1]! },
    sens,
    ventesPerdues: aJour.ventes - enRetard.ventes,
    nonServieEnPlus: enRetard.nonServie - aJour.nonServie,
    coutDuRetard,
    partDuResultat: auDixieme((coutDuRetard / aJour.resultat) * 100),
    nonServieEnPlusLong: long.nonServie - aJour.nonServie,
    coutDuRetardLong,
    verdict,
    /** Un stock reste au bilan de fin d'année, à jour ou en retard : la ligne se montre. */
    avecStock: aJour.stockFinal > 0 || enRetard.stockFinal > 0 || long.stockFinal > 0,
  };
}

type Information = ReturnType<typeof informationATemps>;

/** Ce qui reste quand le plan est trop haut : du stock, ou une offre perdue pour une activité qui ne se stocke pas. */
const invenduEcrit = (c: Cas, k: Information, n: number) =>
  k.perissable
    ? `${qte(n)} ${c.unites} ${accordPluriel(c, "offert")} ne se sont pas ${accordPluriel(c, "vendu")}, et ne se vendront plus`
    : `${qte(n)} ${c.unites} sont ${accordPluriel(c, "resté")} en stock`;

function tableauDeLAnneeAJour(c: Cas): TableauDeDonnees {
  const k = informationATemps(c);
  const ligne = (libelle: string, f: (t: TrimestreDeLEquipe) => string) => ({ libelle, valeurs: k.aJour.trimestres.map(f) });
  return {
    titre: `L'année ${dE(c.entreprise)} dans l'arène, l'équipe à jour`,
    colonnes: TRIMESTRES.map((t) => `Trimestre ${t}`),
    lignes: [
      ligne(`« ${k.libellePlan} » (${c.unites})`, (t) => qte(t.plan)),
      ligne(`Ventes (${c.unites})`, (t) => qte(t.ventes)),
      ligne(`Demande non servie (${c.unites})`, (t) => qte(t.nonServie)),
      ligne("Résultat de l'activité", (t) => eur(t.resultat)),
    ],
  };
}

function tableauDesPlans(c: Cas): TableauDeDonnees {
  const k = informationATemps(c);
  const ligne = (libelle: string, a: AnneeDeLEquipe, f: (t: TrimestreDeLEquipe) => number) => ({ libelle, valeurs: a.trimestres.map((t) => qte(f(t))) });
  return {
    titre: `Les trimestres ${dE(c.entreprise)}, à jour et avec ${R1}`,
    colonnes: TRIMESTRES.map((t) => `Trimestre ${t}`),
    lignes: [
      ligne(`« ${k.libellePlan} », à jour`, k.aJour, (t) => t.plan),
      ligne(`« ${k.libellePlan} », avec ${R1}`, k.enRetard, (t) => t.plan),
      ligne(`Ventes, à jour`, k.aJour, (t) => t.ventes),
      ligne(`Ventes, avec ${R1}`, k.enRetard, (t) => t.ventes),
      ligne(`Demande non servie, à jour`, k.aJour, (t) => t.nonServie),
      ligne(`Demande non servie, avec ${R1}`, k.enRetard, (t) => t.nonServie),
    ],
  };
}

function tableauDesDeuxAnnees(c: Cas): TableauDeDonnees {
  const k = informationATemps(c);
  const ligne = (libelle: string, f: (a: AnneeDeLEquipe) => string) => ({ libelle, valeurs: [f(k.aJour), f(k.enRetard)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, à jour et avec ${R1}`,
    colonnes: ["À jour", `Avec ${R1}`],
    lignes: [
      ligne(`Ventes (${c.unites})`, (a) => qte(a.ventes)),
      ligne(`Demande non servie (${c.unites})`, (a) => qte(a.nonServie)),
      ...(k.avecStock ? [ligne("Stock au bilan de fin d'année", (a) => eur(a.stockFinal))] : []),
      ligne("Chiffre d'affaires", (a) => eur(a.chiffreDAffaires)),
      ligne("Résultat de l'activité", (a) => eur(a.resultat)),
    ],
  };
}

function tableauDesTroisAnnees(c: Cas): TableauDeDonnees {
  const k = informationATemps(c);
  const annees = [k.aJour, k.enRetard, k.long];
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée avec chaque retard`,
    colonnes: ["À jour", `Avec ${R1}`, `Avec ${R2}`],
    lignes: [
      ...TRIMESTRES.map((t) => ({ libelle: `« ${k.libellePlan} », trimestre ${t}`, valeurs: annees.map((a) => qte(a.trimestres[t - 1]!.plan)) })),
      { libelle: `Demande non servie sur l'année (${c.unites})`, valeurs: annees.map((a) => qte(a.nonServie)) },
      { libelle: "Résultat de l'activité sur l'année", valeurs: annees.map((a) => eur(a.resultat)) },
    ],
  };
}

/** Ce que le retard a fait au trimestre le plus touché, en une phrase. */
function trimestreLePlusTouche(c: Cas, k: Information) {
  const p = k.plusTouche;
  if (k.sens === "egal") return `Au trimestre ${p.trimestre}, le plan joué en retard vaut le plan à jour : la demande n'avait pas changé.`;
  return k.sens === "trop-bas"
    ? `Au trimestre ${p.trimestre}, l'équipe en retard prévoit ${qte(p.enRetard.plan)} ${c.unites}, ${qte(-p.ecart)} de moins que l'équipe à jour : la demande avait monté, et elle ne le savait pas encore. La demande non servie y monte à ${qte(p.enRetard.nonServie)} ${c.unites}, contre ${qte(p.aJour.nonServie)} à jour : des clients sont repartis sans être servis.`
    : `Au trimestre ${p.trimestre}, l'équipe en retard prévoit ${qte(p.enRetard.plan)} ${c.unites}, ${qte(p.ecart)} de plus que l'équipe à jour : la demande avait baissé, et elle ne le savait pas encore. Ce trimestre-là, ${invenduEcrit(c, k, p.enRetard.invendu)}.`;
}

export const UNE_INFORMATION_A_TEMPS: Chapitre = {
  code: "une-information-a-temps",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 2 · Numérique et intelligence collective"],
  titre: "Une information qui circule à temps",
  accroche:
    "Ceux qui vendent voient les premiers les clients qui repartent ; ceux qui fixent la production décident sur leurs chiffres. L'arène rejoue l'année avec une équipe où ces chiffres arrivent en retard : ce que coûte un trimestre de retard, puis deux.",
  objectifs: [
    "Dire qui détient une information dans l'équipe, et qui en a besoin pour décider",
    "Retrouver les chiffres sur lesquels décide une équipe en retard",
    "Lire l'écart entre une décision prise à jour et une décision prise en retard",
    "Chiffrer ce que le retard de l'information coûte au résultat",
    "Distinguer ce que le cours suppose de ce que l'arène calcule",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_INFORMATION,
    pourquoi:
      "ce chapitre mesure les clients qu'une équipe en retard laisse repartir, et VOLT FITNESS vend des abonnements : ses adhérents restent d'un trimestre à l'autre, et aucun n'y repart sans être servi, que l'équipe soit à jour ou non.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Qui voit les chiffres, et quand",
      notions: ["dashboard", "capacity"],
      tableau: tableauDeLAnneeAJour,
      texte: (c) => {
        const k = informationATemps(c);
        return [
          `Chez ${c.entreprise}, ceux qui vendent savent les premiers ce qui s'est vendu, et combien de clients sont repartis sans être servis. Ceux qui fixent la décision « ${k.libellePlan} » et le prix ont besoin de ces chiffres pour décider du trimestre suivant. Une information n'a de valeur que si elle arrive à temps à celui qui décide.`,
          "Le tableau montre l'année du cours dans l'arène, avec une équipe à jour : chaque trimestre, elle décide sur les chiffres du trimestre qui vient de finir. Elle prévoit la demande reçue, ventes manquées comprises.",
          `Le cours suppose maintenant une équipe où les chiffres des ventes arrivent avec ${R1} : le compte rendu d'un trimestre n'est lu qu'après la décision suivante. L'équipe décide alors du plan et du prix sur des chiffres plus vieux, sans les corriger ; le reste de la décision ne change pas. Le retard est une hypothèse du cours. L'arène, elle, rejoue l'année avec les mêmes concurrents et la même façon de gérer, et calcule ce qui se vend, ce qui manque et ce qui reste.`,
        ];
      },
      repere: () => "Une information à jour vaut par la décision qu'elle permet : arrivée trop tard, elle fait décider sur une situation qui a changé.",
    },
    {
      id: "quels-chiffres",
      type: "choix",
      titre: "Sur quels chiffres l'équipe décide",
      notions: ["dashboard"],
      question: () =>
        `Au début du trimestre ${TRIMESTRE_DE_LA_QUESTION}, l'équipe à jour décide sur les chiffres du trimestre ${TRIMESTRE_DE_LA_QUESTION - 1}, qui vient de finir. Avec ${R1}, sur quels chiffres l'équipe décide-t-elle ?`,
      options: () => [
        {
          texte: `Les chiffres du trimestre ${SOURCE_DE_LA_QUESTION}`,
          juste: true,
          retour: `Oui : les chiffres du trimestre ${TRIMESTRE_DE_LA_QUESTION - 1} ne sont pas encore arrivés. L'équipe joue au trimestre ${TRIMESTRE_DE_LA_QUESTION} la décision qu'elle aurait prise au trimestre ${TRIMESTRE_DE_LA_QUESTION - RETARD}, sur les chiffres du trimestre ${SOURCE_DE_LA_QUESTION}. Au trimestre ${TRIMESTRE_DE_DEPART}, aucun chiffre n'est encore arrivé : la décision reste celle du départ, la même pour les deux équipes.`,
        },
        {
          texte: `Les chiffres du trimestre ${TRIMESTRE_DE_LA_QUESTION - 1}`,
          juste: false,
          retour: `Non : ce sont ceux de l'équipe à jour. Avec ${R1}, ils n'arrivent qu'après la décision du trimestre ${TRIMESTRE_DE_LA_QUESTION}.`,
        },
        {
          texte: `Les chiffres du trimestre ${TRIMESTRE_DE_LA_QUESTION}`,
          juste: false,
          retour: `Non : le trimestre ${TRIMESTRE_DE_LA_QUESTION} commence à peine, personne ne connaît encore ses chiffres. Même une équipe à jour décide sur le trimestre qui vient de finir.`,
        },
      ],
    },
    {
      id: "le-plan-en-retard",
      type: "montants",
      titre: "Le plan joué en retard",
      notions: ["capacity", "seasonality"],
      tableau: tableauDesPlans,
      question: (c) => {
        const k = informationATemps(c);
        return `L'arène a rejoué l'année avec ${R1}. Pour chaque trimestre après le premier, calculez l'écart entre « ${k.libellePlan} » joué en retard et celui de l'équipe à jour (en retard moins à jour, négatif si le plan en retard est plus bas).`;
      },
      champs: (c) => {
        const k = informationATemps(c);
        return k.ecarts
          .filter((e) => e.trimestre > TRIMESTRE_DE_DEPART)
          .map((e) => ({
            libelle: `Écart de plan au trimestre ${e.trimestre} (${c.unites})`,
            attendu: e.ecart,
            calcul: `${qte(k.enRetard.trimestres[e.trimestre - 1]!.plan)} − ${qte(k.aJour.trimestres[e.trimestre - 1]!.plan)} = ${qte(e.ecart)}`,
            tolerance: 0,
          }));
      },
      explication: (c) => {
        const k = informationATemps(c);
        const t2 = TRIMESTRE_DE_DEPART + 1;
        const apres = k.ecarts.filter((e) => e.trimestre > TRIMESTRE_DE_DEPART && e.ecart !== 0);
        const sens = apres.every((e) => e.ecart < 0)
          ? "Ici, le plan en retard reste plus bas à chaque trimestre : la demande montait, et l'équipe l'apprenait toujours trop tard."
          : apres.every((e) => e.ecart > 0)
            ? "Ici, le plan en retard reste plus haut à chaque trimestre : la demande baissait, et l'équipe l'apprenait toujours trop tard."
            : "Ici, l'écart change de sens d'un trimestre à l'autre : la demande monte puis baisse avec la saison, et le plan en retard suit avec un temps de décalage.";
        return [
          `Au trimestre ${t2}, l'équipe en retard rejoue la décision du départ, ${qte(k.enRetard.trimestres[t2 - 1]!.plan)} ${c.unites}. Ensuite, chaque trimestre, elle joue le plan qu'elle avait prévu au trimestre d'avant : un plan fait pour une demande qui a déjà changé.`,
          `Un plan trop bas laisse repartir des clients ; un plan trop haut laisse ce qui ne se vend pas. ${sens}`,
        ];
      },
    },
    {
      id: "le-trimestre-le-plus-touche",
      type: "choix",
      titre: "Le trimestre le plus touché",
      notions: ["capacity", "stock"],
      tableau: tableauDesPlans,
      question: (c) => {
        const k = informationATemps(c);
        return `Au trimestre ${k.plusTouche.trimestre}, l'écart de plan est le plus grand de l'année : ${qte(k.plusTouche.ecart)} ${c.unites}. Qu'a produit le retard ce trimestre-là ?`;
      },
      options: (c) => {
        const k = informationATemps(c);
        const constat = trimestreLePlusTouche(c, k);
        return [
          { texte: "Un plan trop bas : des clients sont repartis sans être servis", juste: k.sens === "trop-bas", retour: k.sens === "trop-bas" ? `Oui. ${constat}` : `Non. ${constat}` },
          { texte: "Un plan trop haut : une partie de la production ne s'est pas vendue", juste: k.sens === "trop-haut", retour: k.sens === "trop-haut" ? `Oui. ${constat}` : `Non. ${constat}` },
          { texte: "Rien : le plan joué en retard valait le plan à jour", juste: k.sens === "egal", retour: k.sens === "egal" ? `Oui. ${constat}` : `Non. ${constat}` },
        ];
      },
    },
    {
      id: "ce-que-coute-le-retard",
      type: "montants",
      titre: `Ce que coûte ${R1}`,
      notions: ["income_statement", "revenue"],
      tableau: tableauDesDeuxAnnees,
      question: () =>
        `D'après le tableau, calculez sur l'année les ventes perdues à cause du retard (à jour moins en retard), la demande non servie en plus (en retard moins à jour), puis le résultat de l'activité perdu (à jour moins en retard).`,
      champs: (c) => {
        const k = informationATemps(c);
        return [
          {
            libelle: `Ventes perdues avec ${R1} (${c.unites})`,
            attendu: k.ventesPerdues,
            calcul: `${qte(k.aJour.ventes)} − ${qte(k.enRetard.ventes)} = ${qte(k.ventesPerdues)}`,
            tolerance: 0,
          },
          {
            libelle: `Demande non servie en plus avec ${R1} (${c.unites})`,
            attendu: k.nonServieEnPlus,
            calcul: `${qte(k.enRetard.nonServie)} − ${qte(k.aJour.nonServie)} = ${qte(k.nonServieEnPlus)}`,
            tolerance: 0,
          },
          {
            libelle: `Résultat perdu avec ${R1}`,
            attendu: k.coutDuRetard,
            calcul: `${eur(k.aJour.resultat)} − ${retranche(k.enRetard.resultat)} = ${eur(k.coutDuRetard)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = informationATemps(c);
        return [
          `Avec ${R1}, ${c.entreprise} vend ${qte(k.ventesPerdues)} ${c.unites} de moins sur l'année, et laisse ${qte(k.nonServieEnPlus)} ${c.unites} de demande de plus sans réponse. Les charges de structure, elles, ne baissent pas : le résultat de l'activité perd ${eur(k.coutDuRetard)}, soit ${pct(k.partDuResultat)} du résultat de l'équipe à jour.${k.enRetard.resultat < 0 ? ` L'année finit même en perte : ${eur(k.enRetard.resultat)}.` : ""}`,
          "Les chiffres étaient justes : ils sont seulement arrivés trop tard. Ce que coûte le retard, c'est la différence entre la décision prise sur une situation passée et celle que la situation du moment demandait.",
        ];
      },
    },
    {
      id: "deux-trimestres",
      type: "montants",
      titre: `Avec ${R2}`,
      notions: ["income_statement", "seasonality"],
      tableau: tableauDesTroisAnnees,
      question: () =>
        `L'arène a rejoué l'année une troisième fois, avec ${R2} : au trimestre ${DERNIER}, l'équipe joue le plan prévu au trimestre ${DERNIER - RETARD_LONG}. Calculez la demande non servie en plus et le résultat perdu, toujours par rapport à l'équipe à jour.`,
      champs: (c) => {
        const k = informationATemps(c);
        return [
          {
            libelle: `Demande non servie en plus avec ${R2} (${c.unites})`,
            attendu: k.nonServieEnPlusLong,
            calcul: `${qte(k.long.nonServie)} − ${qte(k.aJour.nonServie)} = ${qte(k.nonServieEnPlusLong)}`,
            tolerance: 0,
          },
          {
            libelle: `Résultat perdu avec ${R2}`,
            attendu: k.coutDuRetardLong,
            calcul: `${eur(k.aJour.resultat)} − ${retranche(k.long.resultat)} = ${eur(k.coutDuRetardLong)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = informationATemps(c);
        return [
          `Avec ${R2}, le résultat perd ${eur(k.coutDuRetardLong)} ; avec ${R1}, il en perdait ${eur(k.coutDuRetard)}.`,
        ];
      },
    },
    {
      id: "un-chiffre-plus-vieux",
      type: "choix",
      titre: "Un chiffre plus vieux coûte-t-il plus cher ?",
      notions: ["seasonality"],
      tableau: tableauDesTroisAnnees,
      question: (c) => {
        const k = informationATemps(c);
        return `Chez ${c.entreprise}, ${R1} coûte ${eur(k.coutDuRetard)} de résultat, et ${R2} coûtent ${eur(k.coutDuRetardLong)}. Que coûte le retard le plus long ?`;
      },
      options: (c) => {
        const k = informationATemps(c);
        const chiffres = `${eur(k.coutDuRetardLong)} avec ${R2}, ${eur(k.coutDuRetard)} avec ${R1}.`;
        const demande = `La demande non servie sur l'année est de ${qte(k.long.nonServie)} ${c.unites} avec ${R2}, contre ${qte(k.enRetard.nonServie)} avec ${R1}.`;
        const pourquoi =
          k.verdict === "moins"
            ? ` Un chiffre plus vieux n'est pas toujours plus loin de la vérité : tout dépend de ce qui a changé entre le trimestre d'où il vient et celui où l'on décide, la saison ou la croissance de la demande. ${demande}`
            : ` Plus le chiffre est vieux, plus la situation a eu le temps de changer depuis : la saison a tourné, la demande a monté ou baissé. ${demande}`;
        const fin = " Aucun des deux ne vaut l'information à jour : chaque retard coûte.";
        return [
          {
            texte: "Au moins le double du retard le plus court",
            juste: k.verdict === "au-moins-le-double",
            retour: k.verdict === "au-moins-le-double" ? `Oui : ${chiffres}${pourquoi}${fin}` : `Non : ${chiffres}`,
          },
          {
            texte: "Plus que le retard le plus court, mais moins du double",
            juste: k.verdict === "plus-mais-moins-du-double",
            retour: k.verdict === "plus-mais-moins-du-double" ? `Oui : ${chiffres}${pourquoi}${fin}` : `Non : ${chiffres}`,
          },
          {
            texte: "Moins que le retard le plus court",
            juste: k.verdict === "moins",
            retour: k.verdict === "moins" ? `Oui : ${chiffres}${pourquoi}${fin}` : `Non : ${chiffres}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      texte: (c) => {
        const k = informationATemps(c);
        return [
          `Chez ${c.entreprise}, des chiffres de vente justes, mais arrivés avec ${R1} chez ceux qui décident, coûtent ${eur(k.coutDuRetard)} de résultat sur l'année, ${pct(k.partDuResultat)} du résultat de l'équipe à jour ; avec ${R2}, ${eur(k.coutDuRetardLong)}.`,
          "Ce que le cours a supposé : le retard, et une équipe qui joue la décision prise sur ses chiffres sans la corriger. Ce que l'arène a calculé : les ventes, la demande non servie, ce qui reste et le résultat de chaque année rejouée, avec les mêmes concurrents et la même façon de gérer.",
          "Une équipe décide bien quand l'information circule : ceux qui la détiennent la partagent dès qu'elle est connue, et ceux qui décident la reçoivent avant de décider. C'est l'intelligence collective : chacun apporte ce qu'il voit, et la décision se prend sur une information commune et à jour.",
        ];
      },
      repere: () => "Ce que coûte le retard d'une information = résultat avec l'information à jour − résultat avec l'information en retard.",
    },
  ],
};
