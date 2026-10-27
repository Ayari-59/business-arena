import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CompanyRoundResult } from "../../../engine/types";
import { scenarioByCode } from "../../scenarios/registry";
import { accord } from "../accords";
import { anneeJouee, type Cas } from "../cas";
import { anneeDeReference, rejouerAvec, surLAnnee, type Changement } from "../gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : PRODUIRE, CAPACITÉ, ÉQUIPE ET PRODUCTIVITÉ (bac STMG, management, palier 1).
 *
 * Produire, c'est combiner des ressources : des équipements, une équipe, du temps. Le chapitre
 * lit l'année du cours trimestre par trimestre (`anneeJouee`, celle du bon gestionnaire) : la
 * capacité des équipements et celle de l'équipe telles que le moteur les rend
 * (`production.machineCapacity`, `production.laborCapacity`), l'effectif de chaque trimestre,
 * ce que l'entreprise a produit. L'élève en tire la capacité de l'entreprise sur l'année (chaque
 * trimestre, la plus petite des deux), son taux d'utilisation, la ressource qui bride la
 * production, puis la productivité du travail : la production par salarié et par heure de travail.
 *
 * Puis l'arène rejoue l'année avec une embauche de plus au premier trimestre, POSÉE EN PLUS des
 * embauches du gestionnaire : une décision RH rejouée remplace toute la décision RH du trimestre,
 * et chez Atlas Conseil, le gestionnaire embauche lui-même. Le gestionnaire réagit ensuite comme il
 * le fait d'habitude : le chapitre dit « les mêmes concurrents et la même façon de gérer », jamais
 * « tout le reste identique ». Le verdict se calcule : l'embauche fait produire plus et se paie là où
 * l'équipe bride la production, elle ne fait rien produire de plus là où ce sont les équipements.
 *
 * Ce que le chapitre ne double pas : « Organiser l'activité » (seconde) calcule la capacité du
 * premier trimestre par les formules, le taux d'occupation et le délai d'un renfort ; « La
 * productivité du service » (BTS MHR) suit les couverts et les nuitées par salarié d'un trimestre
 * plein à un trimestre creux, et leur coût. Ici, l'objet est l'année entière, la productivité du
 * travail, et une décision de manager rejouée par l'arène : embaucher ou non.
 */

/**
 * Les entreprises du chapitre : celles qui font un seul produit et le servent dans le trimestre.
 * La boutique vend une gamme d'articles qui ne demandent pas le même temps de travail, et la salle
 * de sport garde ses adhérents d'un trimestre à l'autre : ce qu'elle sert n'y est pas ce qu'elle
 * produit dans le trimestre. La garde recompte la liste sur le moteur.
 */
export const ENTREPRISES_DE_LA_PRODUCTION: readonly string[] = ENTREPRISES_DU_COURS.filter((code) => {
  const s = scenarioByCode(code).scenario;
  return !(s.products && s.products.length > 1) && !s.subscription;
});

/** Le trimestre où le dirigeant décide l'embauche du rejeu : le premier, pour en voir toute l'année. */
export const TRIMESTRE_DE_L_EMBAUCHE = 1;

/** L'embauche du chapitre : un salarié de plus, en plus de ceux que le gestionnaire embauche. */
export const EMBAUCHES_DU_CHAPITRE = 1;

/**
 * Chez Atlas Conseil, l'arène compte le temps de l'équipe en jours ouvrés : 60 jours par
 * consultant et par trimestre, et un jour-conseil prend un jour. Ailleurs, elle le compte en heures.
 */
const TEMPS_EN_JOURS: ReadonlySet<string> = new Set(["conseil"]);

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « 1er », « 2e » : le rang d'un trimestre, compté à partir de 1. */
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);

/** L'unité de temps de l'entreprise : « heure » ou « jour ». */
const temps = (c: Pick<Cas, "code">) => (TEMPS_EN_JOURS.has(c.code) ? "jour" : "heure");
/** Une durée de travail : « 540 h », « 60 jours ». */
const duree = (c: Pick<Cas, "code">, x: number) => (TEMPS_EN_JOURS.has(c.code) ? `${qte(x)} ${x >= 2 ? "jours" : "jour"}` : `${qte(x)} h`);

/** Un trimestre de production, tel que le moteur le rend. */
export interface TrimestreDeProduction {
  numero: number;
  /** L'effectif du trimestre : les salariés présents quand il commence. */
  effectif: number;
  /** Ce que les équipements peuvent faire, ce que l'équipe peut faire, et la plus petite des deux. */
  outil: number;
  equipe: number;
  capacite: number;
  production: number;
}

/** Une année de production : ses quatre trimestres, ses sommes et sa productivité. */
export interface AnneeDeProduction {
  trimestres: TrimestreDeProduction[];
  outil: number;
  equipe: number;
  capacite: number;
  production: number;
  /** La somme des effectifs des quatre trimestres, et sa moyenne. */
  effectifs: number;
  effectifMoyen: number;
  /** Les heures (ou les jours) de travail de l'année : chaque effectif, par la durée d'un salarié. */
  heures: number;
  utilisation: number;
  parSalarie: number;
  parHeure: number;
  embauches: number;
  resultat: number;
}

/** L'année rejouée avec `n` embauches de plus au premier trimestre, en plus de celles du gestionnaire. */
export const embauchesEnPlus =
  (n: number): Changement =>
  (tour, d) =>
    tour === TRIMESTRE_DE_L_EMBAUCHE ? { ...d, hr: { ...(d.hr ?? {}), hire: (d.hr?.hire ?? 0) + n } } : undefined;

/** L'année du cours rejouée avec `n` embauches de plus au premier trimestre. */
export const anneeAvecEmbauches = (code: string, n: number, cle: string) => rejouerAvec(code, `produire:${cle}`, embauchesEnPlus(n));

/** Une année de l'arène, lue par la production. */
export function anneeDeProduction(code: string, annee: readonly CompanyRoundResult[]): AnneeDeProduction {
  const { depart } = anneeJouee(code);
  const heuresParSalarie = depart.hoursPerEmployee;
  let effectif = depart.headcount;
  const trimestres: TrimestreDeProduction[] = [];
  for (const [k, r] of annee.entries()) {
    // Le moteur ne rend la ligne RH qu'au trimestre où une décision RH est prise ; l'effectif
    // reste sinon celui que le trimestre d'avant a laissé.
    effectif = r.hr?.headcount ?? effectif;
    const outil = Math.round(r.production.machineCapacity);
    const equipe = Math.floor(r.production.laborCapacity + 1e-9);
    trimestres.push({ numero: k + 1, effectif, outil, equipe, capacite: Math.min(outil, equipe), production: Math.round(r.production.produced) });
    effectif = r.hr?.nextHeadcount ?? effectif;
  }
  const somme = (f: (t: TrimestreDeProduction) => number) => trimestres.reduce((x, t) => x + f(t), 0);
  const production = somme((t) => t.production);
  const capacite = somme((t) => t.capacite);
  const effectifs = somme((t) => t.effectif);
  const effectifMoyen = auCentieme(effectifs / trimestres.length);
  const heures = effectifs * heuresParSalarie;
  return {
    trimestres,
    outil: somme((t) => t.outil),
    equipe: somme((t) => t.equipe),
    capacite,
    production,
    effectifs,
    effectifMoyen,
    heures,
    utilisation: auDixieme((production / capacite) * 100),
    parSalarie: auDixieme(production / effectifMoyen),
    parHeure: auCentieme(production / heures),
    embauches: Math.round(surLAnnee(annee, (r) => r.hr?.hired ?? 0)),
    resultat: Math.round(surLAnnee(annee, (r) => r.incomeStatement.operatingIncome)),
  };
}

export type Bride = "outil" | "equipe";
export type VerdictDeLEmbauche = "produit-plus-et-se-paie" | "produit-plus-sans-se-payer" | "ne-produit-pas-plus";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** La production du chapitre : l'année du cours, l'année avec une embauche de plus, et le verdict. */
export function production(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c.code);
  calculs.set(c.code, r);
  return r;
}

function calculer(code: string) {
  const { depart } = anneeJouee(code);
  const s = scenarioByCode(code).scenario;
  const annee = anneeDeProduction(code, anneeDeReference(code));
  const avec = anneeDeProduction(code, anneeAvecEmbauches(code, EMBAUCHES_DU_CHAPITRE, "une-embauche-au-premier-trimestre"));
  const bride: Bride = annee.outil <= annee.equipe ? "outil" : "equipe";
  const productionGagnee = avec.production - annee.production;
  const ecartDeResultat = avec.resultat - annee.resultat;
  const verdict: VerdictDeLEmbauche =
    productionGagnee <= 0 ? "ne-produit-pas-plus" : ecartDeResultat > 0 ? "produit-plus-et-se-paie" : "produit-plus-sans-se-payer";
  return {
    heuresParSalarie: depart.hoursPerEmployee,
    heuresParUnite: s.product.hoursPerUnit,
    effectifDeDepart: depart.headcount,
    salaire: s.hr!.salaryPerEmployeePerRound,
    recrutement: s.hr!.hiringCost,
    annee,
    avec,
    bride,
    capaciteDeLEquipeGagnee: avec.equipe - annee.equipe,
    capaciteGagnee: avec.capacite - annee.capacite,
    productionGagnee,
    ecartDeResultat,
    verdict,
  };
}

const COLONNES_DE_L_ANNEE = [1, 2, 3, 4].map((n) => `${rang(n)} trimestre`);

/** L'année du cours, trimestre par trimestre : l'effectif, les deux capacités, la production. */
export function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const p = production(c);
  const t = p.annee.trimestres;
  return {
    titre: `L'année ${dE(c.entreprise)} dans l'arène`,
    colonnes: COLONNES_DE_L_ANNEE,
    lignes: [
      { libelle: "Effectif (salariés)", valeurs: t.map((x) => qte(x.effectif)) },
      { libelle: `Capacité des équipements (${c.unites})`, valeurs: t.map((x) => qte(x.outil)) },
      { libelle: `Capacité de l'équipe (${c.unites})`, valeurs: t.map((x) => qte(x.equipe)) },
      { libelle: `Production (${c.unites})`, valeurs: t.map((x) => qte(x.production)) },
    ],
  };
}

/** L'année du cours et l'année avec l'embauche, côte à côte. */
function tableauDeLEmbauche(c: Cas): TableauDeDonnees {
  const p = production(c);
  const ligne = (libelle: string, f: (a: AnneeDeProduction) => string) => ({ libelle, valeurs: [f(p.annee), f(p.avec)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée avec un salarié de plus`,
    colonnes: ["L'année du cours", "Avec l'embauche"],
    lignes: [
      ligne("Effectif moyen", (a) => qte(a.effectifMoyen)),
      ligne(`Capacité de l'équipe sur l'année (${c.unites})`, (a) => qte(a.equipe)),
      ligne(`Capacité de l'entreprise sur l'année (${c.unites})`, (a) => qte(a.capacite)),
      ligne(`Production de l'année (${c.unites})`, (a) => qte(a.production)),
      ligne("Résultat de l'activité", (a) => eur(a.resultat)),
    ],
  };
}

/** Ce que la production gagne : « gagne 120 jours-conseil », ou « ne gagne rien ». */
const gagne = (c: Cas, n: number) => (n <= 0 ? "ne gagne rien" : `gagne ${qte(n)} ${c.unites}`);

export const PRODUIRE: Chapitre = {
  code: "produire",
  parcours: "stmg-management",
  palier: 1,
  blocs: [
    "STMG Thème 1 · Les organisations et l'activité de production de biens et de services",
    "STMG Thème 1 · À la rencontre du management des organisations",
  ],
  titre: "Produire : capacité, équipe et productivité",
  accroche:
    "Des équipements, une équipe, du temps : ce que l'entreprise peut produire en un an, ce qu'elle a produit, ce que produit chaque salarié. Puis l'arène rejoue l'année avec une embauche de plus.",
  objectifs: [
    "Calculer la capacité de l'entreprise et son taux d'utilisation",
    "Dire quelle ressource bride la production : les équipements ou l'équipe",
    "Calculer la productivité du travail, par salarié et par heure",
    "Juger une embauche sur ce qu'elle fait produire et sur le résultat",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_PRODUCTION,
    pourquoi:
      "ce chapitre compte ce qu'une équipe et ses équipements produisent d'un seul produit dans le trimestre : la boutique vend une gamme d'articles qui ne demandent pas le même temps de travail, et la salle de sport garde ses adhérents d'un trimestre à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des ressources pour produire",
      notions: ["capacity", "productivity"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const p = production(c);
        return [
          `Pour produire, ${c.entreprise} combine des ressources : des équipements, une équipe de ${qte(p.effectifDeDepart)} salariés au départ, et du temps. Chaque salarié donne ${duree(c, p.heuresParSalarie)} de travail par trimestre, et ${accord(c, "un")} ${c.unite} demande ${duree(c, p.heuresParUnite)} de travail.`,
          `Chaque ressource a sa capacité : le plus que les équipements peuvent faire en un trimestre, et le plus que l'équipe peut faire (ses ${temps(c)}s de travail ÷ le temps ${dE(accord(c, "un"))} ${c.unite}). La capacité de l'entreprise est la plus petite des deux : la ressource la plus faible bride toute la production.`,
          "Le tableau donne l'année du cours, trimestre par trimestre. L'entreprise y joue le bon gestionnaire, qui prévoit sa production d'après la demande de ses clients.",
        ];
      },
      repere: () => "Capacité de l'entreprise = la plus petite des capacités de ses ressources, les équipements ou l'équipe.",
    },
    {
      id: "capacite",
      type: "montants",
      titre: "La capacité et son utilisation",
      notions: ["capacity"],
      tableau: tableauDeLAnnee,
      question: (c) =>
        `Calculez la capacité de l'entreprise sur l'année (chaque trimestre, la plus petite des deux capacités, puis la somme des quatre trimestres), la production de l'année, puis le taux d'utilisation de la capacité (production ÷ capacité × 100, au dixième), en ${c.unites}.`,
      champs: (c) => {
        const a = production(c).annee;
        return [
          { libelle: "Capacité de l'entreprise sur l'année", attendu: a.capacite, calcul: `${a.trimestres.map((t) => qte(t.capacite)).join(" + ")} = ${qte(a.capacite)}`, tolerance: 0 },
          { libelle: "Production de l'année", attendu: a.production, calcul: `${a.trimestres.map((t) => qte(t.production)).join(" + ")} = ${qte(a.production)}`, tolerance: 0 },
          { libelle: "Taux d'utilisation de la capacité (%)", attendu: a.utilisation, calcul: `${qte(a.production)} ÷ ${qte(a.capacite)} × 100 = ${pct(a.utilisation)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const a = production(c).annee;
        const reste = a.capacite - a.production;
        return [
          `${c.entreprise} a utilisé ${pct(a.utilisation)} de sa capacité sur l'année. ${
            reste > 0
              ? `Elle aurait pu produire ${qte(reste)} ${c.unites} de plus avec les mêmes ressources : une capacité inutilisée coûte quand même, car les équipements s'usent et les salariés sont payés, que l'entreprise produise ou non.`
              : "Elle a produit tout ce que ses ressources permettaient : pour produire plus, il lui faudrait plus de ressources."
          }`,
        ];
      },
    },
    {
      id: "ce-qui-bride",
      type: "choix",
      titre: "La ressource qui bride la production",
      notions: ["capacity"],
      tableau: tableauDeLAnnee,
      question: (c) => {
        const a = production(c).annee;
        return `Sur l'année, les équipements ${dE(c.entreprise)} pouvaient faire ${qte(a.outil)} ${c.unites}, son équipe ${qte(a.equipe)}. Quelle ressource bride la production ?`;
      },
      options: (c) => {
        const p = production(c);
        const a = p.annee;
        return [
          {
            texte: "Les équipements : l'équipe pourrait faire davantage",
            juste: p.bride === "outil",
            retour:
              p.bride === "outil"
                ? `Oui : chaque trimestre, les équipements font moins que l'équipe (${qte(a.outil)} contre ${qte(a.equipe)} sur l'année). Pour produire plus, il faudrait d'abord des équipements de plus ; un salarié de plus ne ferait tourner aucun équipement en plus.`
                : `Non : les équipements pourraient faire ${qte(a.outil)} ${c.unites} sur l'année, plus que l'équipe (${qte(a.equipe)}).`,
          },
          {
            texte: "L'équipe : les équipements pourraient faire davantage",
            juste: p.bride === "equipe",
            retour:
              p.bride === "equipe"
                ? `Oui : chaque trimestre, l'équipe fait moins que les équipements (${qte(a.equipe)} contre ${qte(a.outil)} sur l'année). Pour produire plus, il faut d'abord du travail en plus : des salariés, ou des salariés plus productifs.`
                : `Non : l'équipe pourrait faire ${qte(a.equipe)} ${c.unites} sur l'année, plus que les équipements (${qte(a.outil)}).`,
          },
          {
            texte: "Les deux ensemble : leurs capacités s'additionnent",
            juste: false,
            retour: "Non : un équipement sans personne pour le faire tourner ne produit rien, une équipe sans équipement non plus. Les capacités ne s'additionnent pas : c'est la plus petite qui compte.",
          },
        ];
      },
    },
    {
      id: "productivite",
      type: "montants",
      titre: "La productivité du travail",
      notions: ["productivity"],
      tableau: tableauDeLAnnee,
      question: (c) => {
        const p = production(c);
        return `La productivité du travail mesure ce que produit le travail. Calculez l'effectif moyen de l'année (la somme des effectifs des quatre trimestres ÷ 4, au centième), la production par salarié (production de l'année ÷ effectif moyen, au dixième), puis la production par ${temps(c)} de travail (production de l'année ÷ ${temps(c)}s de travail de l'année, au centième). Chaque salarié donne ${duree(c, p.heuresParSalarie)} de travail par trimestre.`;
      },
      champs: (c) => {
        const p = production(c);
        const a = p.annee;
        return [
          { libelle: "Effectif moyen de l'année", attendu: a.effectifMoyen, calcul: `(${a.trimestres.map((t) => qte(t.effectif)).join(" + ")}) ÷ 4 = ${qte(a.effectifMoyen)}`, tolerance: 0.01 },
          { libelle: "Production par salarié", attendu: a.parSalarie, calcul: `${qte(a.production)} ÷ ${qte(a.effectifMoyen)} = ${qte(a.parSalarie)}`, tolerance: 0.1 },
          {
            libelle: `Production par ${temps(c)} de travail`,
            attendu: a.parHeure,
            calcul: `${qte(a.production)} ÷ (${qte(a.effectifs)} × ${duree(c, p.heuresParSalarie)}) = ${qte(a.production)} ÷ ${duree(c, a.heures)} = ${qte(a.parHeure)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const p = production(c);
        const a = p.annee;
        return [
          `Chaque salarié ${dE(c.entreprise)} a produit en moyenne ${qte(a.parSalarie)} ${c.unites} sur l'année, soit ${qte(a.parHeure)} par ${temps(c)} de travail.`,
          `C'est une productivité apparente : elle rapporte toute la production au seul travail, alors que les équipements y ont leur part. ${
            p.bride === "outil"
              ? "Ici, ce sont les équipements qui brident : un salarié de plus ajouterait des heures sans rien produire de plus, et la production par salarié baisserait."
              : "Ici, c'est l'équipe qui bride : chaque salarié de plus apporte du travail que les équipements peuvent absorber."
          }`,
        ];
      },
    },
    {
      id: "une-embauche",
      type: "montants",
      titre: "Une embauche de plus, rejouée",
      notions: ["productivity", "payroll", "income_statement"],
      tableau: tableauDeLEmbauche,
      question: (c) => {
        const p = production(c);
        return `L'arène a rejoué l'année avec un salarié de plus, embauché au premier trimestre en plus de ceux que le gestionnaire embauche lui-même${
          p.annee.embauches > 0 ? ` (il en embauche ${qte(p.annee.embauches)} dans l'année du cours)` : ""
        }, avec les mêmes concurrents et la même façon de gérer. Le salarié arrive au deuxième trimestre ; il coûte ${eur(p.recrutement)} de recrutement, puis ${eur(p.salaire)} par trimestre. Calculez la production gagnée sur l'année, la production par salarié avec l'embauche (au dixième), puis l'écart de résultat de l'activité (avec l'embauche moins l'année du cours).`;
      },
      champs: (c) => {
        const p = production(c);
        return [
          { libelle: "Production gagnée sur l'année", attendu: p.productionGagnee, calcul: `${qte(p.avec.production)} − ${qte(p.annee.production)} = ${qte(p.productionGagnee)}`, tolerance: 0 },
          { libelle: "Production par salarié avec l'embauche", attendu: p.avec.parSalarie, calcul: `${qte(p.avec.production)} ÷ ${qte(p.avec.effectifMoyen)} = ${qte(p.avec.parSalarie)}`, tolerance: 0.1 },
          {
            libelle: "Écart de résultat de l'activité, avec l'embauche moins l'année du cours",
            attendu: p.ecartDeResultat,
            calcul: `${eur(p.avec.resultat)} − ${retranche(p.annee.resultat)} = ${eur(p.ecartDeResultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = production(c);
        return [
          `Avec un salarié de plus, la capacité de l'équipe ${gagne(c, p.capaciteDeLEquipeGagnee)} sur l'année, la capacité de l'entreprise ${gagne(c, p.capaciteGagnee)}, et la production ${gagne(c, p.productionGagnee)}. ${
            p.productionGagnee > 0
              ? `La production par salarié passe de ${qte(p.annee.parSalarie)} à ${qte(p.avec.parSalarie)} ${c.unites}.`
              : `La production par salarié tombe de ${qte(p.annee.parSalarie)} à ${qte(p.avec.parSalarie)} ${c.unites} : le travail ajouté ne trouve pas d'équipement pour produire.`
          }`,
          p.ecartDeResultat > 0
            ? `Le résultat de l'activité monte de ${eur(p.ecartDeResultat)} sur l'année : la marge de la production gagnée paie le recrutement et les salaires.`
            : `Le résultat de l'activité baisse de ${eur(-p.ecartDeResultat)} sur l'année : ${p.productionGagnee > 0 ? "la marge de la production gagnée ne paie pas" : "rien ne vient payer"} le recrutement et les salaires.`,
        ];
      },
    },
    {
      id: "embaucher",
      type: "choix",
      titre: "Embaucher pour produire plus ?",
      notions: ["productivity", "capacity"],
      tableau: tableauDeLEmbauche,
      question: (c) => {
        const p = production(c);
        return `Avec un salarié de plus, la production ${dE(c.entreprise)} ${gagne(c, p.productionGagnee)} sur l'année, et le résultat de l'activité ${p.ecartDeResultat > 0 ? "monte" : "baisse"} de ${eur(Math.abs(p.ecartDeResultat))}. Faut-il embaucher ?`;
      },
      options: (c) => {
        const p = production(c);
        const faits = `la production ${gagne(c, p.productionGagnee)} sur l'année, et le résultat ${p.ecartDeResultat > 0 ? "monte" : "baisse"} de ${eur(Math.abs(p.ecartDeResultat))}.`;
        const pourquoi =
          p.bride === "equipe"
            ? "C'est l'équipe qui bride la production : du travail en plus fait produire plus, tant que les clients le demandent."
            : "Ce sont les équipements qui brident la production : du travail en plus ne fait rien produire de plus.";
        return [
          {
            texte: "Oui : la production monte, et paie le salaire",
            juste: p.verdict === "produit-plus-et-se-paie",
            retour: p.verdict === "produit-plus-et-se-paie" ? `Oui : ${faits} ${pourquoi}` : `Non : ${faits} ${pourquoi}`,
          },
          {
            texte: "Non : la production monte, mais ne paie pas le salaire",
            juste: p.verdict === "produit-plus-sans-se-payer",
            retour: p.verdict === "produit-plus-sans-se-payer" ? `Oui : ${faits} ${pourquoi}` : `Non : ${faits} ${pourquoi}`,
          },
          {
            texte: "Non : l'embauche ne fait rien produire de plus",
            juste: p.verdict === "ne-produit-pas-plus",
            retour:
              p.verdict === "ne-produit-pas-plus"
                ? `Oui : ${faits} ${pourquoi} Pour produire plus, il faudrait d'abord des équipements de plus.`
                : `Non : ${faits} ${pourquoi}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "productivity"],
      texte: (c) => {
        const p = production(c);
        const a = p.annee;
        return [
          `Sur l'année du cours, ${c.entreprise} pouvait produire ${qte(a.capacite)} ${c.unites} et en a produit ${qte(a.production)} : ${pct(a.utilisation)} de sa capacité. ${
            p.bride === "outil" ? "Ce sont ses équipements qui brident la production" : "C'est son équipe qui bride la production"
          }, et chaque salarié a produit ${qte(a.parSalarie)} ${c.unites} en moyenne.`,
          `Produire, pour un manager, c'est faire travailler ensemble des ressources dont la plus faible fixe la capacité. Ajouter une ressource ne sert que si c'est elle qui bride : ici, une embauche de plus ${
            p.verdict === "ne-produit-pas-plus"
              ? "n'a rien fait produire de plus, et la productivité du travail a baissé"
              : p.verdict === "produit-plus-et-se-paie"
                ? "a fait produire plus et a payé son salaire"
                : "a fait produire plus, sans payer son salaire"
          }.`,
        ];
      },
      repere: () => "Taux d'utilisation = production ÷ capacité × 100. Productivité du travail = production ÷ effectif, ou ÷ heures de travail.",
    },
  ],
};
