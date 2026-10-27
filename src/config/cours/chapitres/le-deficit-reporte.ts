import type { CompanyRoundResult, EngineScenarioConfig } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { prolongerLaPartie } from "../../scenarios/rounds";
import { anneeJouee, type Cas } from "../cas";
import { rejouerAvec, type Changement } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";
import { trimestresFiscaux } from "./l-impot-sur-les-societes";

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/** « gagne 3 622 € » ou « perd 2 971 € » : un gain négatif se dit comme une perte. */
const gagne = (x: number) => (x >= 0 ? `gagne ${eur(x)}` : `perd ${eur(-x)}`);
/** Un taux déjà en pour cent : 25 donne « 25 % ». */
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
/** Au centime, sans zéro négatif. */
const centime = (x: number) => auCentime(x) || 0;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Le cours calcule sur les trimestres arrondis au centime, l'arène sur ses montants exacts. */
const aLArrondiPres = (arene: number, cours: number) =>
  Math.abs(arene - cours) >= 0.005 ? `, à ${eur(auCentime(Math.abs(arene - cours)))} d'arrondi près` : "";
/** Une somme de trimestres écrite : « 39 269 € − 4 739 € + … ». */
const somme = (xs: readonly number[]) => xs.map((x, i) => (i === 0 ? eur(x) : `${x < 0 ? "−" : "+"} ${eur(Math.abs(x))}`)).join(" ");

/**
 * CHAPITRE : LE DÉFICIT REPORTÉ, QUAND L'IMPÔT ATTEND (fiscalité de l'entreprise, palier 3).
 *
 * Une année en perte ne paie pas d'impôt, et sa perte devient un déficit que le moteur impute sur
 * le bénéfice des exercices suivants, avant le calcul de l'impôt. L'arène rejoue l'année du cours
 * sur deux exercices, huit trimestres (`deuxExercices`) : le premier est l'année du cours, au
 * trimestre près (la garde le vérifie), le second la suit, comme une partie de huit tours la joue
 * (`prolongerLaPartie`, la saison du métier qui se répète). Le chapitre rejoue ces deux exercices
 * avec un grand entretien au premier (`deuxExercicesDuChapitre`, `FACTEUR_DU_GRAND_ENTRETIEN`),
 * qui le fait passer en perte. Il calcule le déficit de la clôture, l'impôt de l'exercice suivant
 * après imputation, l'acompte du premier trimestre, l'impôt évité et le taux effectif, puis
 * l'impôt rapporté au résultat des deux exercices.
 *
 * CE QUE LE MOTEUR FAIT (src/engine/finance/statements.ts, `exerciceDOuverture`). À l'ouverture d'un
 * exercice, il fige le déficit reportable de la clôture d'avant ; chaque acompte porte sur le
 * résultat cumulé de l'exercice diminué de ce déficit. Le report est intégral et sans limite de
 * durée. Le droit le plafonne chaque exercice (1 000 000 €, plus 50 % du bénéfice au-delà), ce qui
 * ne joue jamais à l'échelle de l'arène : le moteur l'omet, le chapitre le dit. Le report en
 * arrière, que le droit ouvre sur option, n'existe pas dans l'arène : le chapitre le dit aussi.
 *
 * POURQUOI UN GRAND ENTRETIEN. Il faut une année en perte, puis un exercice qui la rattrape. Telle
 * que l'arène la joue, l'élève tenu par le bon gestionnaire, l'année du cours finit en bénéfice
 * dans toutes les entreprises : le déficit n'aurait rien à imputer (la garde le vérifie). Le
 * chapitre rejoue donc les deux exercices avec une décision de plus au premier, un grand entretien
 * du parc : le budget de maintenance de chaque trimestre multiplié par `FACTEUR_DU_GRAND_ENTRETIEN`.
 * Au-dessus du budget de référence, la maintenance ne change ni l'usure du parc ni les rebuts
 * (src/engine/equipment/index.ts, src/engine/production/index.ts) : le premier exercice garde ses
 * ventes et perd la dépense, le second joue la même activité ; les gardes le vérifient.
 *
 * LES ENTREPRISES. Avec le grand entretien, le premier exercice doit finir en perte, le second la
 * rattraper, et le déficit peser au moins `PART_MINIMALE_DU_DEFICIT` du résultat du second :
 * PIXEL & CO et MARTEL & FILS. Ailleurs, le premier exercice reste en bénéfice.
 */

/**
 * LE POIDS MINIMAL DU DÉFICIT, une règle du cours : le déficit du premier exercice vaut au moins
 * cette part du résultat avant impôt du second. L'impôt évité, rapporté à l'impôt qu'aurait payé le
 * second exercice sans report, vaut exactement déficit ÷ résultat du second : avec un dixième, le
 * report fait baisser l'impôt du second exercice d'un dixième au moins, et son taux effectif tombe
 * visiblement sous le taux du scénario. En deçà, le calcul est juste mais ne dit rien à l'élève.
 */
export const PART_MINIMALE_DU_DEFICIT = 0.1;

/** Les entreprises où, avec le grand entretien, le déficit du premier exercice pèse sur le second, qui le rattrape. */
export const ENTREPRISES_EN_DEFICIT = ["ecommerce", "batiment"] as const;

export const TRIMESTRES_PAR_EXERCICE = 4;
export const EXERCICES_REJOUES = 2;

/**
 * LE GRAND ENTRETIEN, une hypothèse du cours : au premier exercice, le budget de maintenance de
 * chaque trimestre multiplié par ce facteur, une révision du parc payée comme une charge. Assez pour
 * faire perdre une année en bénéfice, sans rien changer d'autre à la gestion.
 *
 * POURQUOI 6. Le facteur était de 2 quand la gestion de l'élève était celle d'un concurrent simulé.
 * Tenue par le bon gestionnaire, l'année du cours gagne bien plus : à 2, 3 ou 4, aucun premier
 * exercice ne passe en perte ; à 5, seule PIXEL & CO perd, d'un déficit qui ne pèse pas
 * `PART_MINIMALE_DU_DEFICIT` du résultat suivant. 6 est le plus petit facteur entier où une
 * entreprise au moins tient le chapitre (la garde recompte les entreprises sur ce facteur).
 */
export const FACTEUR_DU_GRAND_ENTRETIEN = 6;

/**
 * Le budget de maintenance que le bon gestionnaire joue au trimestre `t` des deux exercices, sans
 * le grand entretien : le moteur le passe en charge tel quel (`maintenanceCost`).
 */
const maintenanceSansLEntretien = (code: string, t: number) => deuxExercices(code)[t - 1]!.incomeStatement.maintenanceCost;

/**
 * La décision du chapitre : le grand entretien, aux trimestres du premier exercice. Le budget de
 * chaque trimestre est posé, pas multiplié : le bon gestionnaire part de la décision jouée au tour
 * d'avant, si bien qu'un budget multiplié le serait de nouveau au tour suivant, et resterait au
 * second exercice. Le premier exercice joue donc le facteur fois le budget de l'année du cours, le
 * second revient à ce budget.
 */
export const grandEntretien =
  (code: string): Changement =>
  (t, d) => ({
    ...d,
    maintenanceBudget: (t <= TRIMESTRES_PAR_EXERCICE ? FACTEUR_DU_GRAND_ENTRETIEN : 1) * maintenanceSansLEntretien(code, t),
  });

/**
 * Le plafond du report en avant, que le moteur omet (article 209, I du code général des impôts) :
 * chaque exercice impute le déficit jusqu'à 1 000 000 €, plus 50 % du bénéfice qui dépasse ce
 * montant. Le cours ne s'en sert que pour vérifier qu'il ne joue pas.
 */
export const PLAFOND_DU_REPORT_EN_AVANT = 1_000_000;
export const PART_DU_BENEFICE_AU_DELA_DU_PLAFOND = 0.5;

/** L'année du cours suivie d'un second exercice, comme une partie de huit tours la joue. */
export const surDeuxExercices =
  (code: string) =>
  (s: EngineScenarioConfig): EngineScenarioConfig =>
    prolongerLaPartie({ ...s, roundsCount: scenarioByCode(code).scenario.roundsCount }, EXERCICES_REJOUES * TRIMESTRES_PAR_EXERCICE);

/** Les deux exercices rejoués, sans rien changer à la gestion de l'année du cours. */
export const deuxExercices = (code: string) => rejouerAvec(code, "le-deficit-reporte:deux-exercices", () => undefined, surDeuxExercices(code));

/** Les deux exercices du chapitre : les mêmes, avec le grand entretien au premier. */
export const deuxExercicesDuChapitre = (code: string) =>
  rejouerAvec(code, "le-deficit-reporte:grand-entretien", grandEntretien(code), surDeuxExercices(code));

export type Verdict = "l-impot-a-attendu" | "le-deficit-attend-encore";

/** Ce que le déficit devient sur deux exercices rejoués : il se lit pour n'importe quels deux exercices. */
export function lireDeuxExercices(tours: readonly CompanyRoundResult[], taux: number) {
  const ex1 = trimestresFiscaux(tours.slice(0, TRIMESTRES_PAR_EXERCICE), taux);
  const avantImpot1 = ex1.at(-1)!.cumul;
  const impot1 = ex1.at(-1)!.du;
  const deficit = auCentime(Math.max(0, -avantImpot1));
  const ex2 = trimestresFiscaux(tours.slice(TRIMESTRES_PAR_EXERCICE, 2 * TRIMESTRES_PAR_EXERCICE), taux, deficit);
  const avantImpot2 = ex2.at(-1)!.cumul;
  const imposable2 = auCentime(Math.max(0, avantImpot2 - deficit));
  const impot2 = ex2.at(-1)!.du;
  const sansReport = auCentime(taux * Math.max(0, avantImpot2));
  const premier = ex2[0]!;
  const imputeAuPremier = auCentime(Math.min(deficit, Math.max(0, premier.avantImpot)));
  const cumul = auCentime(avantImpot1 + avantImpot2);
  const reportFinal = auCentime(Math.max(0, deficit - avantImpot2));
  const verdict: Verdict = reportFinal === 0 ? "l-impot-a-attendu" : "le-deficit-attend-encore";
  return {
    ex1,
    ex2,
    avantImpot1,
    impot1,
    deficit,
    avantImpot2,
    imposable2,
    impot2,
    resultatNet2: auCentime(avantImpot2 - impot2),
    sansReport,
    evite: auCentime(sansReport - impot2),
    tauxEffectif2: avantImpot2 > 0 ? auCentieme((impot2 / avantImpot2) * 100) : 0,
    premier,
    imputeAuPremier,
    resteApresLePremier: auCentime(deficit - imputeAuPremier),
    cumul,
    tauxSurDeux: cumul > 0 ? auCentieme((impot2 / cumul) * 100) : 0,
    reportFinal,
    verdict,
    // Ce que l'arène inscrit : l'impôt de chaque exercice, et le déficit qu'elle montre imputé au premier trimestre.
    impotDeLArene1: centime(tours.slice(0, TRIMESTRES_PAR_EXERCICE).reduce((t, r) => t + r.incomeStatement.tax, 0)),
    impotDeLArene2: centime(tours.slice(TRIMESTRES_PAR_EXERCICE).reduce((t, r) => t + r.incomeStatement.tax, 0)),
    imputeSelonLArene: centime(tours[TRIMESTRES_PAR_EXERCICE]!.incomeStatement.taxLossUsed ?? 0),
  };
}

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Le déficit de l'année du cours et ce qu'il fait à l'impôt de l'exercice suivant. */
export function deficitReporte(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c.code);
  calculs.set(c.code, r);
  return r;
}

function calculer(code: string) {
  const taux = scenarioByCode(code).scenario.finance.taxRate;
  const tours = deuxExercicesDuChapitre(code);
  const annee = anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
  const maintenance = (xs: readonly CompanyRoundResult[]) => centime(xs.reduce((t, r) => t + r.incomeStatement.maintenanceCost, 0));
  // L'année du cours, sans le grand entretien : son résultat avant impôt et l'impôt que l'arène y a prélevé.
  const sansLEntretien = {
    avantImpot: centime(annee.reduce((t, r) => t + r.incomeStatement.pretaxIncome, 0)),
    impot: centime(annee.reduce((t, r) => t + r.incomeStatement.tax, 0)),
  };
  // La maintenance de plus que le grand entretien a passée au premier exercice.
  const entretien = centime(maintenance(tours.slice(0, TRIMESTRES_PAR_EXERCICE)) - maintenance(annee));
  return { taux, tauxPct: auCentieme(taux * 100), sansLEntretien, entretien, ...lireDeuxExercices(tours, taux) };
}

export const LE_DEFICIT_REPORTE: Chapitre = {
  code: "le-deficit-reporte",
  parcours: "fiscalite",
  palier: 3,
  blocs: [
    "BTS CG P3 · Gestion des obligations fiscales",
    "DCG UE4 · Droit fiscal",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "Le déficit reporté : quand l'impôt attend",
  accroche:
    "Une année en perte ne paie pas d'impôt, et sa perte ne se perd pas : l'arène rejoue deux exercices, et le déficit de la première vient en déduction du bénéfice de la seconde. Combien d'impôt il fait attendre, et combien il en évite.",
  objectifs: [
    "Calculer le déficit reportable d'un exercice en perte",
    "Imputer un déficit sur le bénéfice de l'exercice suivant, avant l'impôt",
    "Calculer l'acompte d'un trimestre quand l'exercice s'ouvre sur un déficit",
    "Calculer l'impôt évité par le report et le taux effectif de l'exercice",
    "Dire en quoi l'arène simplifie le droit : un report sans plafond, pas de report en arrière",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_EN_DEFICIT,
    pourquoi: `ce chapitre suit une année en perte puis un exercice qui la rattrape. L'année du cours finit en bénéfice dans toutes les entreprises ; le chapitre la rejoue donc avec un grand entretien, la maintenance de chaque trimestre multipliée par ${FACTEUR_DU_GRAND_ENTRETIEN}, et seules PIXEL & CO et MARTEL & FILS passent alors d'une perte à un exercice qui la rattrape, avec un déficit d'au moins ${(PART_MINIMALE_DU_DEFICIT * 100).toLocaleString("fr-FR")} % du résultat suivant : assez pour que le report se lise dans l'impôt.`,
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une année en perte",
      notions: ["income_statement"],
      texte: (c) => {
        const k = deficitReporte(c);
        return [
          `Dans l'arène, l'année du cours ${dE(c.entreprise)} ${gagne(k.sansLEntretien.avantImpot)} avant impôt. Le chapitre la rejoue avec une décision de plus, un grand entretien du parc : le budget de maintenance de chaque trimestre multiplié par ${FACTEUR_DU_GRAND_ENTRETIEN}, ${eur(k.entretien)} de charges de plus sur l'année, sans rien changer aux ventes. L'exercice finit en perte.`,
          `Voici ses ${k.ex1.length} trimestres : le résultat avant impôt de chacun, et l'impôt que l'arène a inscrit, un acompte quand le cumul de l'exercice monte, un remboursement quand il baisse. L'arène a ensuite rejoué un second exercice, les ${k.ex2.length} trimestres suivants, avec la gestion de l'année du cours et son budget de maintenance habituel. Ce chapitre suit ce que la perte du premier fait à l'impôt du second.`,
        ];
      },
      tableau: (c) => {
        const k = deficitReporte(c);
        return {
          titre: `Le premier exercice ${dE(c.entreprise)}`,
          colonnes: ["Résultat avant impôt", "Impôt inscrit par l'arène"],
          lignes: k.ex1.map((t) => ({ libelle: `Trimestre ${t.trimestre}`, valeurs: [eur(t.avantImpot), eur(t.arene)] })),
        };
      },
      repere: () => "Une perte ne paie pas d'impôt : elle devient un déficit, qui viendra en déduction des bénéfices suivants.",
    },
    {
      id: "deficit",
      type: "montants",
      titre: "Le déficit de l'exercice",
      notions: ["income_statement"],
      question: () =>
        "Calculez le résultat avant impôt du premier exercice, l'impôt sur les sociétés de cet exercice, puis le déficit reportable à la clôture (en positif).",
      champs: (c) => {
        const k = deficitReporte(c);
        return [
          { libelle: "Résultat avant impôt du premier exercice", attendu: k.avantImpot1, calcul: `${somme(k.ex1.map((t) => t.avantImpot))} = ${eur(k.avantImpot1)}` },
          { libelle: "Impôt sur les sociétés du premier exercice", attendu: k.impot1, calcul: `un exercice en perte : pas d'impôt, ${eur(0)}` },
          { libelle: "Déficit reportable à la clôture", attendu: k.deficit, calcul: `la perte de l'exercice, ${eur(k.deficit)}` },
        ];
      },
      explication: (c) => {
        const k = deficitReporte(c);
        const premierAcompte = k.ex1.find((t) => t.arene > 0);
        return [
          premierAcompte
            ? `Au trimestre ${premierAcompte.trimestre}, l'arène avait prélevé un acompte de ${eur(premierAcompte.arene)} : le cumul était alors en bénéfice. Les trimestres de perte l'ont fait rendre, et l'exercice finit sur ${eur(k.impotDeLArene1)} d'impôt.`
            : `L'arène n'a prélevé aucun acompte : le cumul de l'exercice n'a jamais gagné.`,
          `${c.entreprise} ouvre son second exercice avec un déficit de ${eur(k.deficit)} à reporter. Le moteur le garde de côté, et l'impute dès que l'exercice suivant est en bénéfice.`,
        ];
      },
    },
    {
      id: "imputation",
      type: "choix",
      titre: "Sur quoi s'impute le déficit",
      notions: ["income_statement"],
      question: (c) => `${c.entreprise} reporte ${eur(deficitReporte(c).deficit)} de déficit. Comment l'arène l'impute-t-elle ?`,
      options: (c) => {
        const k = deficitReporte(c);
        return [
          {
            texte: "Sur le bénéfice des exercices suivants, avant le calcul de l'impôt, en entier et sans limite de durée",
            juste: true,
            retour: `Oui : le déficit réduit le bénéfice imposable, pas l'impôt. En droit, le report en avant est lui aussi sans limite de durée, mais chaque exercice n'impute que ${eur(PLAFOND_DU_REPORT_EN_AVANT)}, plus ${pct(PART_DU_BENEFICE_AU_DELA_DU_PLAFOND * 100)} du bénéfice au-delà : à l'échelle de l'arène, ce plafond ne joue jamais, et le moteur l'omet. Le droit permet aussi, sur option, de reporter un déficit en arrière, sur le bénéfice de l'exercice précédent, contre une créance sur l'État ; l'arène ne le fait pas, et ici l'exercice en perte est le premier.`,
          },
          {
            texte: "Sur l'impôt des exercices suivants, euro pour euro",
            juste: false,
            retour: `Non : imputé sur l'impôt, le déficit de ${eur(k.deficit)} effacerait ${eur(k.deficit)} d'impôt. Il s'impute sur le bénéfice : il fait baisser l'impôt de ${pct(k.tauxPct)} de son montant, ${eur(auCentime(k.deficit * k.taux))}.`,
          },
          {
            texte: "Sur l'exercice suivant seulement : ce qui n'y est pas imputé est perdu",
            juste: false,
            retour: "Non : le moteur garde le déficit tant qu'il n'est pas épuisé, exercice après exercice, et le droit aussi.",
          },
        ];
      },
    },
    {
      id: "exercice-suivant",
      type: "montants",
      titre: "L'exercice suivant",
      notions: ["income_statement"],
      tableau: (c) => {
        const k = deficitReporte(c);
        return {
          titre: `Le second exercice ${dE(c.entreprise)}`,
          colonnes: ["Résultat avant impôt"],
          lignes: k.ex2.map((t) => ({ libelle: `Trimestre ${t.trimestre}`, valeurs: [eur(t.avantImpot)] })),
        };
      },
      question: (c) =>
        `Calculez le résultat avant impôt du second exercice, le bénéfice imposable une fois le déficit imputé, puis l'impôt sur les sociétés de l'exercice, au taux de ${pct(deficitReporte(c).tauxPct)}.`,
      champs: (c) => {
        const k = deficitReporte(c);
        return [
          { libelle: "Résultat avant impôt du second exercice", attendu: k.avantImpot2, calcul: `${somme(k.ex2.map((t) => t.avantImpot))} = ${eur(k.avantImpot2)}` },
          { libelle: "Bénéfice imposable après imputation", attendu: k.imposable2, calcul: `${eur(k.avantImpot2)} − ${eur(k.deficit)} de déficit = ${eur(k.imposable2)}` },
          { libelle: "Impôt sur les sociétés du second exercice", attendu: k.impot2, calcul: `${eur(k.imposable2)} × ${pct(k.tauxPct)} = ${eur(k.impot2)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = deficitReporte(c);
        return [
          `L'arène inscrit ${eur(k.impotDeLArene2)} d'impôt sur le second exercice${aLArrondiPres(k.impotDeLArene2, k.impot2)}, trimestre après trimestre : ${k.ex2.map((t) => eur(t.arene)).join(", ")}. C'est l'impôt du bénéfice imposable, pas celui du résultat avant impôt.`,
          k.reportFinal === 0
            ? `Le déficit est épuisé : ${c.entreprise} clôt le second exercice sans rien à reporter.`
            : `Le bénéfice ne suffit pas à épuiser le déficit : il reste ${eur(k.reportFinal)} à reporter sur l'exercice d'après.`,
        ];
      },
    },
    {
      id: "premier-acompte",
      type: "montants",
      titre: "Le premier trimestre du nouvel exercice",
      notions: ["income_statement", "cash_budget"],
      question: (c) => {
        const k = deficitReporte(c);
        return `Au premier trimestre du second exercice, ${c.entreprise} ${gagne(k.premier.avantImpot)} avant impôt. L'acompte porte sur le cumul de l'exercice diminué du déficit trouvé à l'ouverture, ${eur(k.deficit)}. Calculez l'acompte du trimestre, puis le déficit qui reste à reporter après lui.`;
      },
      champs: (c) => {
        const k = deficitReporte(c);
        const p = k.premier;
        return [
          {
            libelle: "Acompte du premier trimestre du second exercice",
            attendu: p.acompte,
            calcul:
              p.avantImpot > k.deficit
                ? `(${eur(p.avantImpot)} − ${eur(k.deficit)}) × ${pct(k.tauxPct)} = ${eur(p.acompte)}`
                : `le cumul ne dépasse pas le déficit : pas d'acompte, ${eur(0)}`,
            tolerance: 1,
          },
          {
            libelle: "Déficit qui reste à reporter après ce trimestre",
            attendu: k.resteApresLePremier,
            calcul: `${eur(k.deficit)} − ${eur(k.imputeAuPremier)} imputés = ${eur(k.resteApresLePremier)}`,
          },
        ];
      },
      explication: (c) => {
        const k = deficitReporte(c);
        const sans = auCentime(Math.max(0, k.premier.avantImpot) * k.taux);
        return [
          `Sans déficit à reporter, l'acompte aurait été de ${eur(sans)}. ${
            k.resteApresLePremier === 0
              ? `Tout le déficit s'impute dès ce trimestre : l'arène l'affiche au compte de résultat, sur la ligne « dont déficit antérieur imputé (report) », ${eur(k.imputeSelonLArene)}${aLArrondiPres(k.imputeSelonLArene, k.deficit)}.`
              : `Le trimestre n'absorbe que ${eur(k.imputeAuPremier)} du déficit : le reste attend les trimestres suivants.`
          }`,
          "Le déficit fait attendre l'impôt dès le premier trimestre où l'entreprise gagne de nouveau : la trésorerie le sent tout de suite, par un acompte plus petit.",
        ];
      },
    },
    {
      id: "impot-evite",
      type: "montants",
      titre: "L'impôt évité",
      notions: ["income_statement"],
      question: () =>
        "Sur le même résultat du second exercice, sans déficit à reporter, quel aurait été l'impôt ? Calculez-le, puis l'impôt évité par le report, et le taux effectif du second exercice : l'impôt payé rapporté au résultat avant impôt, en %.",
      champs: (c) => {
        const k = deficitReporte(c);
        return [
          { libelle: "Impôt sans déficit à reporter", attendu: k.sansReport, calcul: `${eur(k.avantImpot2)} × ${pct(k.tauxPct)} = ${eur(k.sansReport)}`, tolerance: 1 },
          { libelle: "Impôt évité par le report", attendu: k.evite, calcul: `${eur(k.sansReport)} − ${eur(k.impot2)} = ${eur(k.evite)}`, tolerance: 1 },
          { libelle: "Taux effectif du second exercice (%)", attendu: k.tauxEffectif2, calcul: `${eur(k.impot2)} ÷ ${eur(k.avantImpot2)} × 100 = ${pct(k.tauxEffectif2)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = deficitReporte(c);
        return [
          `Le report évite ${eur(k.evite)} d'impôt, ${pct(k.tauxPct)} du déficit de ${eur(k.deficit)} : le déficit ne s'impute pas sur l'impôt, il retire son montant du bénéfice taxé.`,
          `Le taux effectif du second exercice tombe à ${pct(k.tauxEffectif2)}, sous les ${pct(k.tauxPct)} du scénario : il ne dit pas que l'impôt a baissé, il dit qu'une perte passée est venue en déduction.`,
        ];
      },
    },
    {
      id: "deux-exercices",
      type: "choix",
      titre: "Sur les deux exercices",
      notions: ["income_statement"],
      question: (c) => {
        const k = deficitReporte(c);
        return `Sur les deux exercices, ${c.entreprise} ${gagne(k.cumul)} avant impôt au total, et paie ${eur(k.impot2)} d'impôt. Que retenir ?`;
      },
      options: (c) => {
        const k = deficitReporte(c);
        const rendus = auCentime(k.ex1.filter((t) => t.arene < 0).reduce((s, t) => s - t.arene, 0));
        return [
          {
            texte: `Sur les deux exercices, l'impôt vaut ${pct(k.tauxPct)} du résultat cumulé : le report fait payer sur ce qui a été gagné en tout`,
            juste: k.verdict === "l-impot-a-attendu",
            retour:
              k.verdict === "l-impot-a-attendu"
                ? `Oui : ${eur(k.impot2)} ÷ ${eur(k.cumul)} = ${pct(k.tauxSurDeux)}. Sans le report, ${c.entreprise} aurait payé ${eur(k.sansReport)} sur le second exercice après n'avoir rien gagné sur le premier. L'impôt a attendu que la perte soit rattrapée.`
                : `Non : une part du déficit, ${eur(k.reportFinal)}, n'est pas encore imputée.`,
          },
          {
            texte: "Une part du déficit attend encore : le second exercice n'a pas suffi à l'absorber",
            juste: k.verdict === "le-deficit-attend-encore",
            retour:
              k.verdict === "le-deficit-attend-encore"
                ? `Oui : il reste ${eur(k.reportFinal)} de déficit, qui viendra en déduction du bénéfice d'un exercice suivant.`
                : `Non : le second exercice gagne ${eur(k.avantImpot2)}, plus que le déficit de ${eur(k.deficit)}, qui est épuisé.`,
          },
          {
            texte: "Sans le report, l'impôt du second exercice aurait été le même : le déficit ne sert qu'à présenter les comptes",
            juste: false,
            retour: `Non : sans le report, l'impôt du second exercice aurait été de ${eur(k.sansReport)}, ${eur(k.evite)} de plus.`,
          },
          {
            texte: `L'État a versé ${eur(k.evite)} l'année de la perte, au titre du déficit`,
            juste: false,
            retour:
              rendus > 0
                ? `Non : l'exercice en perte n'a rien reçu au titre du déficit. Les ${eur(rendus)} que l'arène a rendus en cours d'année étaient ses propres acomptes. L'économie arrive au second exercice, quand le bénéfice revient.`
                : "Non : l'exercice en perte n'a rien reçu. L'économie arrive au second exercice, quand le bénéfice revient.",
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement"],
      texte: (c) => {
        const k = deficitReporte(c);
        return [
          `Avec le grand entretien, ${c.entreprise} perd ${eur(k.deficit)} sur son premier exercice et ne paie pas d'impôt. Le second ${gagne(k.avantImpot2)} ; le déficit en retire ${eur(k.avantImpot2 - k.imposable2)} avant l'impôt, qui tombe de ${eur(k.sansReport)} à ${eur(k.impot2)}.`,
          "Dans l'arène, le déficit se reporte en entier, sans limite de durée, et s'impute dès le premier trimestre où l'exercice gagne. Le droit plafonne le report de chaque exercice et permet, sur option, un report en arrière ; à la taille des entreprises de l'arène, le plafond ne joue pas.",
        ];
      },
      repere: () =>
        "Bénéfice imposable = résultat avant impôt − déficit reporté. Impôt évité = déficit imputé × taux. Le déficit ne s'impute jamais sur l'impôt lui-même.",
    },
  ],
};
