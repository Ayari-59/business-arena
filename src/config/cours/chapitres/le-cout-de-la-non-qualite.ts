import type { CompanyRoundResult, QualityActionDef } from "../../../engine/types";
import { soldUnits } from "../../../engine/simulation/runGame";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CHAPITRE : LE COÛT DE LA NON-QUALITÉ (BTS GPME, gestion des risques, palier 3).
 *
 * La qualité a deux sortes de coûts : la prévention, qu'on choisit (le budget qualité de la
 * feuille de décision), et la non-qualité, qu'on subit (les rebuts, la défaillance interne ; les
 * retours des clients, la défaillance externe). Le moteur rend les trois à chaque trimestre
 * (`qualityCosts`). L'arène rejoue l'année à quatre budgets de prévention : le coût total de la
 * qualité désigne un niveau, le résultat de l'activité, qui compte aussi les ventes que la
 * qualité attire, peut en désigner un autre. Le chapitre finit sur une démarche qualité du
 * catalogue du scénario (`qualityActions`), payée une fois, et son délai de récupération.
 *
 * Il ne se joue que dans les entreprises dont le scénario chiffre la non-qualité et dont l'année du
 * cours engage un budget de prévention (`QUALITES`) : ailleurs, le moteur ne compte ni rebut ni
 * retour, et le budget qualité n'a rien à prévenir ; chez PIXEL & CO, qui chiffre la non-qualité,
 * la gestion de l'arène n'engage aucun budget de prévention (le formulaire n'en propose pas), et
 * la moitié ou le double de rien ne se comparent pas (la garde le vérifie).
 */

/**
 * Les entreprises du cours dont le scénario chiffre la non-qualité (`qualityCosts`), où le budget
 * qualité se décide pour toute l'entreprise, et où l'année du cours en engage un.
 */
export const QUALITES = ["bistrot"] as const;

/** Le budget de prévention que la gestion engage au trimestre `t` de l'année du cours. */
export const preventionDeLAnnee = (code: string, t: number) => anneeDeReference(code)[t - 1]!.qualityCosts?.prevention ?? 0;

/**
 * L'année rejouée à une part du budget de prévention de l'année du cours, trimestre par
 * trimestre. Le budget se pose en valeur, celle de l'année du cours multipliée par la part : la
 * gestion de l'arène reconduit sa décision du trimestre d'avant, et une part appliquée à la
 * décision reçue se composerait d'un trimestre à l'autre.
 */
export const anneeALaPrevention = (code: string, part: number) =>
  part === 1 ? anneeDeReference(code) : rejouerAvec(code, `prevention-${part}`, (t, d) => ({ ...d, qualityBudget: preventionDeLAnnee(code, t) * part }));

/**
 * Les budgets de prévention rejoués, en part du budget de la gestion équilibrée (le budget de
 * l'année du cours), à chaque trimestre : aucun, la moitié, le même, le double. Une hypothèse du
 * cours : quatre points suffisent à voir le coût total descendre puis remonter, ou monter
 * d'emblée.
 */
export const NIVEAUX_DE_PREVENTION = [
  { part: 0, nom: "Aucun", option: "Sans aucun budget de prévention" },
  { part: 0.5, nom: "La moitié", option: "À la moitié du budget actuel" },
  { part: 1, nom: "Le budget actuel", option: "Au budget actuel" },
  { part: 2, nom: "Le double", option: "Au double du budget actuel" },
] as const;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const ans = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} an${x >= 2 ? "s" : ""}`;
/** Où se situe un budget rejoué, dans une phrase : « sans aucun budget », « à la moitié du budget actuel ». */
const ouEst = (n: { part: number; option: string }) => (n.part === 0 ? "sans aucun budget" : n.option.charAt(0).toLowerCase() + n.option.slice(1));
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

type Annee = readonly CompanyRoundResult[];
const somme = (a: Annee, f: (r: CompanyRoundResult) => number | undefined) => Math.round(surLAnnee(a, (r) => f(r) ?? 0));

/** Les coûts de la qualité d'une année rejouée, à l'euro, tels que le moteur les rend. */
export function coutsDeLaQualite(a: Annee) {
  const prevention = somme(a, (r) => r.qualityCosts?.prevention);
  const interne = somme(a, (r) => r.qualityCosts?.internalFailure);
  const externe = somme(a, (r) => r.qualityCosts?.externalFailure);
  return {
    prevention,
    interne,
    externe,
    nonQualite: interne + externe,
    total: prevention + interne + externe,
    rebuts: somme(a, (r) => r.qualityCosts?.defectUnits),
    retours: somme(a, (r) => r.qualityCosts?.returnedUnits),
    ventes: somme(a, soldUnits),
    resultat: somme(a, (r) => r.incomeStatement.operatingIncome),
  };
}

/**
 * Les démarches du catalogue qui visent les défauts : celles dont le premier niveau réduit les
 * rebuts ou les retours sans jouer sur l'image. Une démarche d'image fait vendre (elle relève
 * de la communication), elle ne se mesure pas en défauts évités.
 */
export function demarchesContreLesDefauts(code: string): QualityActionDef[] {
  const catalogue = scenarioByCode(code).scenario.qualityActions?.actions ?? [];
  return catalogue.filter((a) => {
    const e = a.levels.find((l) => l.level === 1)?.effects ?? {};
    return ((e.defectRateReduction ?? 0) > 0 || (e.returnRateReduction ?? 0) > 0) && !(e.qualityImageBonus ?? 0);
  });
}

/**
 * Une démarche qualité décidée au premier trimestre, à son premier niveau : son coût (payé une
 * fois), les défaillances qu'elle évite sur l'année et les économies de production qu'elle fait
 * (le moteur les inscrit en produit exceptionnel), puis son délai de récupération. Hypothèse du
 * cours : la démarche garde ses effets, et les années suivantes en gagnent autant que la première.
 */
export function demarche(code: string, action: QualityActionDef) {
  const niveau = action.levels.find((l) => l.level === 1)!;
  const reference = anneeDeReference(code);
  const avec = rejouerAvec(code, `demarche-${action.code}`, (t, d) => (t === 1 ? { ...d, qualityActions: [{ actionCode: action.code, level: 1 }] } : undefined));
  const sans = coutsDeLaQualite(reference);
  const apres = coutsDeLaQualite(avec);
  const cout = surLAnnee(avec, (r) => (r.qualityActions?.started ?? []).reduce((t, x) => t + x.cost, 0));
  const economiesSans = somme(reference, (r) => r.incomeStatement.exceptionalIncome);
  const economiesAvec = somme(avec, (r) => r.incomeStatement.exceptionalIncome);
  const evitees = sans.nonQualite - apres.nonQualite;
  const economies = economiesAvec - economiesSans;
  const gain = evitees + economies;
  return {
    code: action.code,
    nom: action.label,
    niveau: niveau.label,
    cout,
    visePlutotLesRetours: (niveau.effects.returnRateReduction ?? 0) > 0 && !(niveau.effects.defectRateReduction ?? 0),
    nonQualiteSans: sans.nonQualite,
    nonQualiteAvec: apres.nonQualite,
    economiesSans,
    economiesAvec,
    evitees,
    economies,
    gain,
    delai: gain > 0 ? Math.round((cout / gain) * 10) / 10 : null,
  };
}

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** La qualité du chapitre : l'année du cours, les quatre budgets rejoués, la démarche. */
export function nonQualite(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c.code);
  calculs.set(c.code, r);
  return r;
}

function calculer(code: string) {
  const s = scenarioByCode(code).scenario;
  const reference = anneeDeReference(code);
  const annee = coutsDeLaQualite(reference);
  const niveaux = NIVEAUX_DE_PREVENTION.map((n) => ({
    ...n,
    ...coutsDeLaQualite(anneeALaPrevention(code, n.part)),
  }));
  const actuel = niveaux.findIndex((n) => n.part === 1);
  const double = niveaux.findIndex((n) => n.part === 2);
  const leMoinsCher = niveaux.reduce((m, n, i) => (n.total < niveaux[m]!.total ? i : m), 0);
  const leMeilleur = niveaux.reduce((m, n, i) => (n.resultat > niveaux[m]!.resultat ? i : m), 0);
  const ajoutee = niveaux[double]!.prevention - niveaux[actuel]!.prevention;
  const evitees = niveaux[actuel]!.nonQualite - niveaux[double]!.nonQualite;
  return {
    budgetDuTrimestre: Math.round(reference[0]!.qualityCosts?.prevention ?? 0),
    sansRetour: (s.qualityCosts?.externalReturnSensitivity ?? 0) === 0,
    annee,
    niveaux,
    actuel,
    double,
    ajoutee,
    evitees,
    eviteesPour100: auCentime((evitees / ajoutee) * 100),
    leMoinsCher,
    leMeilleur,
    demarche: demarche(code, demarchesContreLesDefauts(code)[0]!),
  };
}

/** Les trois coûts de chaque budget rejoué, pour les deux étapes qui les comparent. */
function tableauDesNiveaux(c: Cas) {
  const q = nonQualite(c);
  return {
    titre: "L'année rejouée à quatre budgets de prévention",
    colonnes: q.niveaux.map((n) => n.nom),
    lignes: [
      { libelle: "Prévention sur l'année", valeurs: q.niveaux.map((n) => eur(n.prevention)) },
      { libelle: "Défaillance interne : rebuts", valeurs: q.niveaux.map((n) => eur(n.interne)) },
      { libelle: "Défaillance externe : retours", valeurs: q.niveaux.map((n) => eur(n.externe)) },
    ],
  };
}

export const LE_COUT_DE_LA_NON_QUALITE: Chapitre = {
  code: "le-cout-de-la-non-qualite",
  parcours: "gpme",
  palier: 3,
  blocs: ["BTS GPME Bloc 2 · Participer à la gestion des risques de la PME"],
  titre: "Le coût de la non-qualité",
  accroche:
    "Prévenir coûte, ne pas prévenir aussi : les rebuts se jettent, les retours se remboursent. L'arène rejoue l'année à quatre budgets de prévention : le bon niveau de qualité est un calcul.",
  objectifs: [
    "Distinguer le coût de la prévention et les coûts de la non-qualité",
    "Calculer le coût total de la qualité d'une année",
    "Comparer ce qu'un euro de prévention coûte et ce qu'il évite",
    "Juger un budget de qualité sur le résultat, ventes comprises",
    "Calculer le délai de récupération d'une démarche qualité",
  ],
  libre: false,
  entreprises: {
    codes: QUALITES,
    pourquoi:
      "ce chapitre compare des budgets de prévention autour de celui de l'année. Ailleurs, le moteur ne chiffre pas la non-qualité ; chez PIXEL & CO, il la chiffre, mais l'année du cours n'engage aucun budget de prévention.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Prévenir ou réparer",
      notions: ["variable_costs"],
      texte: (c) => {
        const q = nonQualite(c);
        return [
          `Chez ${c.entreprise}, la qualité a deux sortes de coûts. Celui qu'on choisit : la prévention, le budget qualité de la feuille de décision, ${eur(q.budgetDuTrimestre)} par trimestre dans l'année du cours. Et ceux qu'on subit, la non-qualité : les rebuts, produits puis jetés, que l'arène compte à leur coût variable (la défaillance interne) ; les retours des clients, remboursés au prix de vente (la défaillance externe).`,
          `Dans l'arène, chaque euro de prévention élève la qualité produite, de moins en moins à mesure que le budget grossit, et la part des rebuts baisse avec elle. ${
            q.sansRetour
              ? "Le scénario du métier ne compte aucun retour de client : toute la non-qualité y est interne."
              : q.annee.externe === 0
                ? "Les retours ne viennent que quand la qualité perçue par les clients passe sous son niveau de base ; dans l'année du cours, elle n'y est jamais passée : aucun retour."
                : `Dans l'année du cours, les clients ont retourné ${qte(q.annee.retours)} ${c.unites}.`
          }`,
        ];
      },
      tableau: (c) => {
        const q = nonQualite(c);
        return {
          titre: `Les coûts de la qualité ${dE(c.entreprise)}, sur l'année du cours`,
          colonnes: [`Quantité (${c.unites})`, "Montant"],
          lignes: [
            { libelle: "Prévention : budget qualité", valeurs: ["", eur(q.annee.prevention)] },
            { libelle: "Défaillance interne : rebuts", valeurs: [qte(q.annee.rebuts), eur(q.annee.interne)] },
            { libelle: "Défaillance externe : retours", valeurs: [qte(q.annee.retours), eur(q.annee.externe)] },
          ],
        };
      },
      repere: () => "Coût total de la qualité = prévention + défaillance interne + défaillance externe.",
    },
    {
      id: "cout-total",
      type: "montants",
      titre: "Le coût total de la qualité",
      notions: ["variable_costs", "income_statement"],
      question: () => "Calculez le coût de la non-qualité de l'année (rebuts et retours), puis le coût total de la qualité, prévention comprise.",
      champs: (c) => {
        const q = nonQualite(c);
        return [
          { libelle: "Coût de la non-qualité", attendu: q.annee.nonQualite, calcul: `${eur(q.annee.interne)} + ${eur(q.annee.externe)} = ${eur(q.annee.nonQualite)}`, tolerance: 1 },
          { libelle: "Coût total de la qualité", attendu: q.annee.total, calcul: `${eur(q.annee.prevention)} + ${eur(q.annee.nonQualite)} = ${eur(q.annee.total)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const q = nonQualite(c);
        return [
          `Sur ${eur(q.annee.total)}, la prévention en prend ${eur(q.annee.prevention)}, la non-qualité ${eur(q.annee.nonQualite)}. ${
            q.annee.prevention > q.annee.nonQualite
              ? "Ici, la prévention coûte plus que les défauts qu'elle laisse passer : la question est de savoir ce qu'elle évite."
              : "Ici, les défauts coûtent plus que la prévention : la question est de savoir ce qu'un euro de prévention de plus éviterait."
          }`,
        ];
      },
    },
    {
      id: "quatre-budgets",
      type: "montants",
      titre: "Quatre budgets rejoués",
      notions: ["variable_costs"],
      tableau: tableauDesNiveaux,
      question: () =>
        "L'arène a rejoué l'année à quatre budgets de prévention, tout le reste identique. Calculez le coût total de la qualité sans budget, puis au double du budget actuel. Calculez enfin les défaillances évitées pour 100 € de prévention ajoutée, du budget actuel au double (défaillances évitées ÷ prévention ajoutée × 100).",
      champs: (c) => {
        const q = nonQualite(c);
        const aucun = q.niveaux[0]!;
        const dbl = q.niveaux[q.double]!;
        const act = q.niveaux[q.actuel]!;
        return [
          { libelle: "Coût total de la qualité, sans budget", attendu: aucun.total, calcul: `${eur(aucun.prevention)} + ${eur(aucun.interne)} + ${eur(aucun.externe)} = ${eur(aucun.total)}`, tolerance: 1 },
          { libelle: "Coût total de la qualité, au double", attendu: dbl.total, calcul: `${eur(dbl.prevention)} + ${eur(dbl.interne)} + ${eur(dbl.externe)} = ${eur(dbl.total)}`, tolerance: 1 },
          {
            libelle: "Défaillances évitées pour 100 € ajoutés",
            attendu: q.eviteesPour100,
            calcul: `(${eur(act.nonQualite)} − ${retranche(dbl.nonQualite)}) ÷ (${eur(dbl.prevention)} − ${eur(act.prevention)}) × 100 = ${eur(q.eviteesPour100)}`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const q = nonQualite(c);
        return [
          `Doubler la prévention coûte ${eur(q.ajoutee)} de plus sur l'année, et évite ${eur(q.evitees)} de défaillances : ${eur(q.eviteesPour100)} pour 100 € dépensés. ${
            q.eviteesPour100 < 100
              ? "Un euro de prévention qui évite moins d'un euro de défaillance coûte plus qu'il ne protège."
              : "Chaque euro de prévention évite plus d'un euro de défaillance : il se paie."
          }`,
        ];
      },
    },
    {
      id: "par-le-cout",
      type: "choix",
      titre: "Le bon niveau, par le coût",
      notions: ["variable_costs"],
      tableau: tableauDesNiveaux,
      question: () => "À quel budget de prévention le coût total de la qualité est-il le plus bas ?",
      options: (c) => {
        const q = nonQualite(c);
        const min = q.niveaux[q.leMoinsCher]!;
        return q.niveaux.map((n, i) => ({
          texte: n.option,
          juste: i === q.leMoinsCher,
          retour:
            i === q.leMoinsCher
              ? `Oui : ${eur(n.total)}, le plus bas des quatre. ${
                  n.part === 0
                    ? "Ici, chaque euro de prévention évite moins qu'il ne coûte, dès le premier."
                    : "Au-dessous, les défauts coûtent plus que la prévention économisée ; au-dessus, la prévention ajoutée coûte plus que les défauts évités."
                }`
              : `Non : ${eur(n.total)}, contre ${eur(min.total)} ${ouEst(min)}.`,
        }));
      },
    },
    {
      id: "par-le-resultat",
      type: "choix",
      titre: "Ce que le coût de la qualité ne compte pas",
      notions: ["demand_market_share", "income_statement"],
      tableau: (c) => {
        const q = nonQualite(c);
        return {
          titre: "Les quatre budgets, ventes et résultat compris",
          colonnes: q.niveaux.map((n) => n.nom),
          lignes: [
            { libelle: "Coût total de la qualité", valeurs: q.niveaux.map((n) => eur(n.total)) },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: q.niveaux.map((n) => qte(n.ventes)) },
            { libelle: "Résultat de l'activité sur l'année", valeurs: q.niveaux.map((n) => eur(n.resultat)) },
          ],
        };
      },
      question: () =>
        "La qualité ne joue pas que sur les défauts : la qualité perçue attire aussi des clients. À quel budget le résultat de l'activité est-il le plus haut, et pourquoi ?",
      options: (c) => {
        const q = nonQualite(c);
        const meilleur = q.niveaux[q.leMeilleur]!;
        const memeQueLeCout = q.leMeilleur === q.leMoinsCher;
        const leDernier = q.leMeilleur === q.niveaux.length - 1 && !memeQueLeCout;
        const ventesDuMeilleur = meilleur.ventes - q.niveaux[q.leMoinsCher]!.ventes;
        return [
          {
            texte: "Au coût le plus bas : les ventes gagnées ne paient pas la prévention",
            juste: memeQueLeCout,
            retour: memeQueLeCout
              ? `Oui : ${ouEst(meilleur)}, le résultat est aussi le plus haut, ${eur(meilleur.resultat)}. La qualité fait vendre un peu plus (${qte(q.niveaux[q.niveaux.length - 1]!.ventes - meilleur.ventes)} ${c.unites} de plus au double), mais pas assez pour payer la prévention.`
              : `Non : le meilleur résultat (${eur(meilleur.resultat)}) vient d'un autre budget que le coût le plus bas ; les ventes gagnées y paient une part de la prévention.`,
          },
          {
            texte: "Plus haut que le coût le plus bas : les ventes paient une part de la prévention",
            juste: !memeQueLeCout && !leDernier,
            retour:
              !memeQueLeCout && !leDernier
                ? `Oui : le résultat est le plus haut ${ouEst(meilleur)}, ${eur(meilleur.resultat)}, et les ventes y sont plus hautes de ${qte(ventesDuMeilleur)} ${c.unites} qu'au coût le plus bas. Le coût de la qualité ne compte pas ces ventes : il désigne un budget trop bas.`
                : memeQueLeCout
                  ? "Non : les ventes gagnées au-dessus ne paient pas la prévention ajoutée ; le meilleur résultat est au coût le plus bas."
                  : "Non : le résultat monte jusqu'au plus gros budget rejoué.",
          },
          {
            texte: "Au plus gros budget : la qualité fait vendre plus qu'elle ne coûte",
            juste: leDernier,
            retour: leDernier
              ? `Oui : le résultat est le plus haut au double du budget actuel, ${eur(meilleur.resultat)}. Les ventes que la qualité attire paient toute la prévention ajoutée.`
              : `Non : au double du budget, le résultat tombe à ${eur(q.niveaux[q.niveaux.length - 1]!.resultat)}. Plus de qualité n'est pas toujours plus de résultat.`,
          },
        ];
      },
    },
    {
      id: "demarche",
      type: "montants",
      titre: "Une démarche qualité, payée une fois",
      notions: ["irr_payback"],
      tableau: (c) => {
        const d = nonQualite(c).demarche;
        return {
          titre: `« ${d.niveau} », décidée au premier trimestre`,
          colonnes: ["Sans", "Avec"],
          lignes: [
            { libelle: "Coût de la démarche, payé une fois", valeurs: [eur(0), eur(d.cout)] },
            { libelle: "Non-qualité de l'année : rebuts et retours", valeurs: [eur(d.nonQualiteSans), eur(d.nonQualiteAvec)] },
            { libelle: "Économies sur les coûts de production", valeurs: [eur(d.economiesSans), eur(d.economiesAvec)] },
          ],
        };
      },
      question: () =>
        "Le catalogue de l'arène propose aussi des démarches qualité : un coût payé une fois, des effets qui restent. Calculez le gain de la démarche sur l'année (non-qualité évitée plus économies de production), puis son délai de récupération en années (coût ÷ gain d'une année), à 0,1 près, en supposant que les années suivantes gagnent autant que la première.",
      champs: (c) => {
        const d = nonQualite(c).demarche;
        return [
          {
            libelle: "Gain de la démarche sur l'année",
            attendu: d.gain,
            calcul: `(${eur(d.nonQualiteSans)} − ${retranche(d.nonQualiteAvec)}) + (${eur(d.economiesAvec)} − ${retranche(d.economiesSans)}) = ${eur(d.gain)}`,
            tolerance: 1,
          },
          { libelle: "Délai de récupération (années)", attendu: d.delai ?? 0, calcul: `${eur(d.cout)} ÷ ${eur(d.gain)} = ${ans(d.delai ?? 0)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const d = nonQualite(c).demarche;
        return [
          `${d.visePlutotLesRetours && d.evitees === 0 ? "Elle n'évite aucune défaillance cette année : elle vise les retours, et il n'y en a pas eu. Tout son gain vient des économies de production, que le moteur inscrit à part, en produit exceptionnel. " : ""}La démarche coûte ${eur(d.cout)} une fois, et rapporte ${eur(d.gain)} par an tant que ses effets durent : elle se rembourse en ${ans(d.delai ?? 0)}. ${
            (d.delai ?? 0) <= 1
              ? "Elle se paie dès la première année."
              : "C'est un investissement : il se juge sur plusieurs années, pas sur la première."
          }`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["variable_costs"],
      texte: (c) => {
        const q = nonQualite(c);
        const min = q.niveaux[q.leMoinsCher]!;
        const meilleur = q.niveaux[q.leMeilleur]!;
        return [
          `Chez ${c.entreprise}, la qualité coûte ${eur(q.annee.total)} sur l'année du cours, dont ${eur(q.annee.nonQualite)} de non-qualité. Le coût total est le plus bas ${ouEst(min)} (${eur(min.total)}) ; le résultat de l'activité est le plus haut ${ouEst(meilleur)} (${eur(meilleur.resultat)}).`,
          "Le bon niveau de qualité n'est pas le zéro défaut : c'est celui où un euro de prévention de plus évite moins d'un euro de défaillance, ventes gagnées comprises. Une démarche qualité, payée une fois, se juge comme un investissement, par son délai de récupération.",
        ];
      },
      repere: () => "Coût total de la qualité = prévention + non-qualité. On augmente la prévention tant qu'un euro de plus évite plus d'un euro de défaillance, ou fait gagner plus d'un euro de marge.",
    },
  ],
};
