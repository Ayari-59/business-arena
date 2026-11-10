import { arrondi, arrondi2, nombreAuCentieme } from "../../../pedagogy/cours/deux-decimales";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import {
  ALPHAS,
  ALPHA_A_LA_MAIN,
  MOIS,
  VENTES_LISSEES,
  ajustementPuissance,
  correlationBrute,
  correlationCVS,
  correlationsDesAjustements,
  lissage,
  meilleurAlpha,
  serieCVS,
  tendancesAuRang,
} from "../monde/correlation-et-lissage";
import { auMillieme } from "../monde/prevision-des-ventes";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : PRÉVOIR LES VENTES : CORRÉLATION ET LISSAGE (contrôle de gestion, palier 4 ; DCG UE11
 * § 3.2).
 *
 * LA SUITE DE « PRÉVOIR LES VENTES : TENDANCE ET SAISONS », pour ce que le DCG ajoute au BTS. Ce
 * chapitre-là en a 17 étapes ; les trois techniques du DCG, chacune avec son expérience, en
 * demandaient plus que les 20 permises (tests/cours/chapitres-decoupes.test.ts) : elles forment
 * donc une suite, sur les mêmes séries, sans changer un chiffre du premier (monde/correlation-et-lissage.ts).
 *   · LE COEFFICIENT DE CORRÉLATION, calculé sur la série brute du marché (r = 0,774), puis sur la
 *     série corrigée des variations saisonnières (r = 0,984) ;
 *   · L'AJUSTEMENT PUISSANCE, y = b × t^a, par les logarithmes, face à la droite et à l'exponentielle ;
 *   · LE LISSAGE EXPONENTIEL, sur les ventes en ligne de NOVA aux particuliers, mois par mois en N.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui du DCG) :
 *   · guidé : le-coefficient-de-correlation (les sommes sont dans la question), le-lissage-a-la-main
 *     (la première ligne est donnée) ;
 *   · l'expérience avant la formule : predire-r avant le calcul ; predire-la-puissance puis
 *     le-laboratoire-des-tendances avant l-ajustement-puissance ; predire-alpha puis
 *     le-laboratoire-du-lissage avant la-prevision-de-janvier ;
 *   · autonome : la-serie-cvs, la-correlation-de-la-cvs, l-ajustement-puissance, la-prevision-de-janvier ;
 *   · expert : le-choix-de-l-ajustement (trois tendances, deux séries), ce-que-le-lissage-ne-voit-pas ;
 *     puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les coefficients de corrélation et de détermination restent
 * au millième, l'exposant a et ln b au dix-millième (des coefficients) ; b se donne au centième, et
 * la tendance du rang 13 en repart, puis s'arrondit à l'enceinte (à 15 et 20 enceintes près, avant)
 * ; la série CVS et la tendance sont des quantités, à l'enceinte ; chaque prévision du lissage
 * s'arrondit au centième et la suivante en repart (monde/correlation-et-lissage.ts).
 */

/** La prévision se calcule sur le marché et les ventes de NOVA, que le monde du cours tient. */
export const ENTREPRISES_DE_LA_CORRELATION: readonly string[] = ["nova"];

/** Le laboratoire des tendances : le rang du trimestre prévu, du 1er de N + 1 au 4e de N + 3. */
export const RANGS_DU_LABORATOIRE = { min: 13, max: 24, pas: 1 } as const;

/** L'écart entre la droite et l'exponentielle que le défi du laboratoire des tendances guette. */
export const ECART_GUETTE = 1_000;

/** Les mois que le lissage à la main calcule (février à juin, avec α = 0,3). */
export const MOIS_A_LA_MAIN = 5;

const qte = nombreAuCentieme;
const dec = (x: number, d: number) => (x + 0).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/^-/, "−");
const NOMS = ["1er trimestre", "2e trimestre", "3e trimestre", "4e trimestre"] as const;

const donnee = (valeur: number, unite = "enceintes"): CelluleACompleter => ({ valeur, unite });

/**
 * L'ajustement puissance tel que l'élève le calcule (deux décimales, 10 novembre 2026) : a et ln b au
 * dix-millième, b au centième, la tendance du rang 13 à deux décimales puis à l'enceinte.
 */
function puissanceALaMain(p: { a: number; xMoyen: number; yMoyen: number }) {
  const a = arrondi(p.a, 4);
  const lnB = arrondi(arrondi(p.yMoyen, 4) - a * arrondi(p.xMoyen, 4), 4);
  const b = arrondi2(Math.exp(lnB));
  const exact13 = arrondi2(b * 13 ** a);
  return { a, lnB, b, exact13, rang13: Math.round(exact13) };
}
const texte = (valeur: number, t: string): CelluleACompleter => ({ valeur, texte: t });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

let memoire: ReturnType<typeof calculerLaCorrelation> | null = null;

/** Tout ce que le chapitre lit, calculé une fois (les données sont figées : le résultat se garde). */
export function correlationEtLissage() {
  memoire ??= calculerLaCorrelation();
  return memoire;
}

function calculerLaCorrelation() {
  const brute = correlationBrute();
  const cvs = correlationCVS();
  const serie = serieCVS();
  const puissance = ajustementPuissance("brute");
  const r = { brute: correlationsDesAjustements("brute"), cvs: correlationsDesAjustements("cvs") };
  const alpha = meilleurAlpha();
  const lisse = lissage(alpha);
  const main = lissage(ALPHA_A_LA_MAIN);
  return { brute, cvs, serie, puissance, r, alpha, lisse, main };
}

/** Le premier rang où l'exponentielle s'écarte de la droite de plus que l'écart guetté. */
export function premierRangEcarte() {
  for (let t = RANGS_DU_LABORATOIRE.min; t <= RANGS_DU_LABORATOIRE.max; t++) {
    const x = tendancesAuRang(t);
    if (x.exponentiel - x.lineaire > ECART_GUETTE) return t;
  }
  return RANGS_DU_LABORATOIRE.max;
}

/** Le marché, trimestre par trimestre, de N − 2 à N. */
function tableauDuMarche(): TableauDeDonnees {
  const { serie } = correlationEtLissage();
  return {
    titre: "Les enceintes vendues sur tout le marché, par trimestre (rang t de 1 à 12)",
    colonnes: ["N − 2", "N − 1", "N"],
    lignes: NOMS.map((nom, q) => ({ libelle: nom, valeurs: ["N − 2", "N − 1", "N"].map((a) => qte(serie.find((x) => x.annee === a && x.trimestre === q + 1)!.marche)) })),
  };
}

/** Les coefficients de corrélation des trois ajustements, sur les deux séries. */
function tableauDesCorrelations(): TableauDeDonnees {
  const { r } = correlationEtLissage();
  const l = (x: number) => dec(x, 3);
  return {
    titre: "Le coefficient de corrélation de chaque ajustement",
    colonnes: ["Série brute", "Série CVS"],
    lignes: [
      { libelle: "Linéaire : y sur t", valeurs: [l(r.brute.lineaire), l(r.cvs.lineaire)] },
      { libelle: "Exponentiel : ln y sur t", valeurs: [l(r.brute.exponentiel), l(r.cvs.exponentiel)] },
      { libelle: "Puissance : ln y sur ln t", valeurs: [l(r.brute.puissance), l(r.cvs.puissance)] },
    ],
  };
}

/** Les ventes en ligne aux particuliers en N. */
function tableauDesParticuliers(): TableauDeDonnees {
  return {
    titre: "Les enceintes vendues en ligne aux particuliers, en N",
    colonnes: ["Ventes"],
    lignes: VENTES_LISSEES.map((v, m) => ({ libelle: MOIS[m]!, valeurs: [qte(v)] })),
  };
}

/** La série CVS : celle de N à calculer, les deux premières années données. */
function grilleDeLaCVS(): TableauACompleter {
  const { serie } = correlationEtLissage();
  return {
    titre: "La série corrigée des variations saisonnières, à l'enceinte",
    colonnes: ["Marché", "Coefficient saisonnier", "Série CVS"],
    lignes: serie.map((x) => ({
      libelle: `${NOMS[x.trimestre - 1]} de ${x.annee} (rang ${x.rang})`,
      cellules: [
        donnee(x.marche),
        texte(x.coefficient, dec(x.coefficient, 3)),
        x.annee === "N"
          ? aSaisir(x.cvs, `${qte(x.marche)} ÷ ${dec(x.coefficient, 3)} = ${qte(x.marche / x.coefficient)}, arrondi à l'enceinte : ${qte(x.cvs)}`, { unite: "enceintes", nature: "quantite", indice: "le marché du trimestre divisé par son coefficient" })
          : { ...donnee(x.cvs), calcul: `${qte(x.marche)} ÷ ${dec(x.coefficient, 3)}` },
      ],
    })),
  };
}

/** Le lissage à la main, avec α = 0,3 : février donné, mars à juin à calculer. */
function grilleDuLissage(): TableauACompleter {
  const { main } = correlationEtLissage();
  const a = ALPHA_A_LA_MAIN;
  return {
    titre: `Le lissage exponentiel, α = ${qte(a)}`,
    colonnes: ["Ventes", "Prévision", "Erreur (ventes − prévision)"],
    lignes: main.mois.slice(0, MOIS_A_LA_MAIN).map((m, i) => {
      const avant = main.mois[i - 1];
      const prevision =
        i === 0
          ? { ...donnee(m.prevision), calcul: `la vente de janvier, ${qte(VENTES_LISSEES[0]!)}` }
          : aSaisir(m.prevision, `${qte(a)} × ${qte(avant!.vente)} + ${qte(1 - a)} × ${qte(avant!.prevision)} = ${qte(m.prevision)}`, { unite: "enceintes", indice: "α × la vente du mois d'avant + (1 − α) × la prévision du mois d'avant" });
      return {
        libelle: MOIS[m.mois]!,
        cellules: [donnee(m.vente), prevision, aSaisir(m.erreur, `${qte(m.vente)} − ${qte(m.prevision)} = ${qte(m.erreur)}`, { unite: "enceintes", indice: "la vente moins la prévision" })],
      };
    }),
  };
}

export const CORRELATION_ET_LISSAGE: Chapitre = {
  code: "correlation-et-lissage",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["DCG UE11 · Contrôle de gestion"],
  titre: "Prévoir les ventes : corrélation et lissage",
  accroche:
    "La suite de la prévision des ventes, pour le DCG : la force d'une tendance par le coefficient de corrélation, l'ajustement puissance, puis le mois suivant par le lissage exponentiel, sur le marché et les ventes en ligne de NOVA.",
  objectifs: [
    "Calculer et interpréter un coefficient de corrélation linéaire",
    "Corriger une série des variations saisonnières et y mesurer la corrélation",
    "Ajuster une tendance puissance par un changement de variable logarithmique",
    "Choisir entre les ajustements linéaire, exponentiel et puissance, et justifier le choix",
    "Prévoir par lissage exponentiel et choisir la constante de lissage",
  ],
  libre: false,
  prerequis: ["la-prevision-des-ventes"],
  ensuite: ["des-ventes-aux-achats"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_CORRELATION,
    pourquoi: "la prévision se calcule ici sur le marché des enceintes et les ventes en ligne de NOVA, que la simulation du cours tient ; la méthode vaut pour toute entreprise qui a un historique.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que le DCG ajoute à la prévision",
      notions: ["seasonality"],
      tableau: () => tableauDuMarche(),
      texte: () => {
        const { brute } = correlationEtLissage();
        return [
          `Le chapitre « Prévoir les ventes : tendance et saisons » a tracé la tendance du marché, y = ${qte(brute.droite.a)} t + ${qte(brute.droite.b)}, et en a lu le coefficient de corrélation. Ce chapitre le calcule, et demande ce qu'il vaut quand la saison s'en mêle.`,
          "Puis deux outils de plus : l'ajustement puissance, pour une croissance qui ralentit, et le lissage exponentiel, pour prévoir le mois suivant d'une série sans forme nette.",
        ];
      },
      repere: () => "r = Σ (t − t̄)(y − ȳ) ÷ √[Σ (t − t̄)² × Σ (y − ȳ)²], entre −1 et 1 ; plus il est proche de 1 en valeur absolue, plus les points sont alignés.",
    },
    {
      id: "predire-r",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur la corrélation",
      notions: ["seasonality"],
      question: () => "Le marché grandit d'année en année, mais il monte et descend avec la saison. Avant de calculer, pariez : son coefficient de corrélation avec le temps sera…",
      options: () => [
        { texte: "Positif, mais abaissé par la saison", juste: true, retour: "Bon pari. La tendance monte, r est donc positif ; mais les pics et les creux écartent les points de la droite, et r reste loin de 1." },
        { texte: "Proche de 1 : le marché grandit chaque année", juste: false, retour: "Non : chaque année grandit, mais à l'intérieur de l'année les trimestres montent et descendent. Les points ne sont pas alignés." },
        { texte: "Proche de 0 : la série monte et descend sans cesse", juste: false, retour: "Non : sous la saison, la tendance monte nettement. Le lien avec le temps existe, il est seulement brouillé." },
      ],
    },
    {
      id: "le-coefficient-de-correlation",
      objectifs: [0],
      type: "montants",
      titre: "Le coefficient de corrélation",
      notions: ["seasonality"],
      tableau: () => tableauDuMarche(),
      question: () => {
        const { brute } = correlationEtLissage();
        return `Sur les 12 trimestres, Σ (t − t̄)(y − ȳ) = ${qte(brute.sxy)}, Σ (t − t̄)² = ${qte(brute.sxx)} et Σ (y − ȳ)² = ${qte(brute.syy)}. Calculez r, au millième, puis r², au millième.`;
      },
      champs: () => {
        const { brute } = correlationEtLissage();
        return [
          { libelle: "Coefficient de corrélation r", nature: "coefficient", attendu: auMillieme(brute.r), tolerance: 0.001, calcul: `${qte(brute.sxy)} ÷ √(${qte(brute.sxx)} × ${qte(brute.syy)}) = ${dec(brute.r, 3)}` },
          { libelle: "Coefficient de détermination r²", nature: "coefficient", attendu: auMillieme(brute.r2), tolerance: 0.001, calcul: `${dec(brute.r, 3)}² = ${dec(brute.r2, 3)}` },
        ];
      },
      explication: () => {
        const { brute } = correlationEtLissage();
        return [
          `r = ${dec(brute.r, 3)} : la tendance existe, mais le temps n'explique que ${qte(Math.round(brute.r2 * 100))} % des écarts des ventes à leur moyenne (r²). Le reste tient surtout à la saison, que la droite ne voit pas.`,
        ];
      },
    },
    {
      id: "la-serie-cvs",
      objectifs: [1],
      type: "a-completer",
      titre: "La série corrigée des variations saisonnières",
      notions: ["seasonality"],
      question: () =>
        "Pour voir la tendance sans la saison, divisez chaque trimestre par son coefficient saisonnier, ceux du chapitre précédent : c'est la série CVS. Complétez les 4 trimestres de N, à l'enceinte.",
      grille: () => grilleDeLaCVS(),
      explication: () => {
        const { serie } = correlationEtLissage();
        return [
          `La série CVS monte presque sans à-coups, de ${qte(serie[0]!.cvs)} à ${qte(serie.at(-1)!.cvs)} enceintes : le printemps et Noël n'y font plus de pics. Seul le 1er trimestre de N reste bas, ${qte(serie[8]!.cvs)} : un hiver faible, que la saison n'explique pas.`,
        ];
      },
    },
    {
      id: "la-correlation-de-la-cvs",
      objectifs: [1],
      type: "montants",
      titre: "La corrélation de la série CVS",
      notions: ["seasonality"],
      question: () => {
        const { cvs } = correlationEtLissage();
        return `Sur la série CVS, Σ (t − t̄)(y − ȳ) = ${qte(cvs.sxy)}, Σ (t − t̄)² = ${qte(cvs.sxx)} et Σ (y − ȳ)² = ${qte(cvs.syy)}. Calculez r et r², au millième.`;
      },
      champs: () => {
        const { cvs } = correlationEtLissage();
        return [
          { libelle: "Coefficient de corrélation r", nature: "coefficient", attendu: auMillieme(cvs.r), tolerance: 0.001, calcul: `${qte(cvs.sxy)} ÷ √(${qte(cvs.sxx)} × ${qte(cvs.syy)}) = ${dec(cvs.r, 3)}` },
          { libelle: "Coefficient de détermination r²", nature: "coefficient", attendu: auMillieme(cvs.r2), tolerance: 0.001, calcul: `${dec(cvs.r, 3)}² = ${dec(cvs.r2, 3)}` },
        ];
      },
      explication: () => {
        const { cvs, brute } = correlationEtLissage();
        return [`Sans la saison, r passe de ${dec(brute.r, 3)} à ${dec(cvs.r, 3)} : la tendance du marché est très régulière. Le temps explique ${qte(Math.round(cvs.r2 * 100))} % des écarts de la série CVS.`];
      },
    },
    {
      id: "ce-que-dit-r",
      objectifs: [0, 1],
      type: "choix",
      titre: "Ce que dit r",
      notions: ["seasonality"],
      question: () => {
        const { cvs } = correlationEtLissage();
        return `Sur la série CVS, r = ${dec(cvs.r, 3)}. Que pouvez-vous en dire ?`;
      },
      options: () => {
        const { cvs } = correlationEtLissage();
        return [
          { texte: "Les points sont presque alignés sur une droite", juste: true, retour: "Oui, et c'est tout ce que dit r : un lien linéaire fort. Il ne dit ni pourquoi le marché grandit, ni que la droite est la meilleure forme : une courbe peut faire mieux." },
          { texte: `Le temps cause ${qte(Math.round(cvs.r * 1000) / 10)} % des ventes du marché`, juste: false, retour: "Non, deux fois : r n'est pas un pourcentage (c'est r² qui mesure la part expliquée), et une corrélation ne prouve aucune cause." },
          { texte: "La droite est forcément le meilleur ajustement pour prévoir", juste: false, retour: "Non : une exponentielle ou une puissance peuvent aussi bien coller. Il faut comparer les ajustements, et regarder la forme de la croissance." },
        ];
      },
    },
    {
      id: "predire-la-puissance",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la puissance",
      question: () => "L'ajustement puissance cherche une courbe y = b × t^a. Avec un exposant a compris entre 0 et 1, avant de calculer, pariez : que suppose-t-elle de la croissance du marché ?",
      options: () => [
        { texte: "Qu'elle ralentit avec le temps", juste: true, retour: "Bon pari : t^a grandit de moins en moins vite quand a est sous 1. Un exposant au-dessus de 1 dirait l'inverse, une croissance qui accélère. Le laboratoire suivant compare les trois tendances." },
        { texte: "Qu'elle garde le même pourcentage chaque trimestre", juste: false, retour: "Non : c'est l'exponentielle, y = B × A^t, qui suppose un taux constant." },
        { texte: "Qu'elle garde la même quantité chaque trimestre", juste: false, retour: "Non : c'est la droite, y = a t + b, qui ajoute la même quantité à chaque rang." },
      ],
    },
    {
      id: "le-laboratoire-des-tendances",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des trois tendances",
      notions: ["seasonality"],
      question: () =>
        `Choisissez le rang du trimestre à prévoir, de ${qte(RANGS_DU_LABORATOIRE.min)} (le 1er de N + 1) à ${qte(RANGS_DU_LABORATOIRE.max)} (le 4e de N + 3). Le tableau donne la tendance de la droite, de l'exponentielle et de la puissance ; le graphique les trace selon le rang. Relevez le défi.`,
      leviers: () => [{ code: "rang", libelle: "Rang du trimestre prévu", unite: "", ...RANGS_DU_LABORATOIRE, depart: RANGS_DU_LABORATOIRE.min }],
      lecture: (_, p) => {
        const t = tendancesAuRang(p.rang!);
        return [
          { libelle: "Tendance linéaire", montant: Math.round(t.lineaire), unite: "enceintes" },
          { libelle: "Tendance exponentielle", montant: Math.round(t.exponentiel), unite: "enceintes" },
          { libelle: "Tendance puissance", montant: Math.round(t.puissance), unite: "enceintes" },
          { libelle: "Écart de l'exponentielle sur la droite", montant: Math.round(t.exponentiel - t.lineaire), unite: "enceintes", fort: true },
        ];
      },
      graphique: () => ({
        levier: "rang",
        unite: "enceintes",
        courbes: [
          { libelle: "Linéaire", valeur: (p) => Math.round(tendancesAuRang(p.rang!).lineaire) },
          { libelle: "Exponentielle", valeur: (p) => Math.round(tendancesAuRang(p.rang!).exponentiel) },
          { libelle: "Puissance", valeur: (p) => Math.round(tendancesAuRang(p.rang!).puissance) },
        ],
      }),
      montrer: "Montrer le rang",
      defi: () => {
        const rang = premierRangEcarte();
        return {
          consigne: `Trouvez le premier rang où l'exponentielle prévoit plus de ${qte(ECART_GUETTE)} enceintes de plus que la droite.`,
          atteint: (p) => p.rang === rang,
          indice: (p) => {
            const t = tendancesAuRang(p.rang!);
            return t.exponentiel - t.lineaire > ECART_GUETTE ? "L'écart dépasse déjà le seuil ici : un rang plus tôt le dépassait peut-être aussi." : "L'écart reste sous le seuil : allez plus loin dans le temps.";
          },
          solution: { rang },
        };
      },
      explication: (_, p) => {
        const t = tendancesAuRang(p.rang!);
        return [
          `Au rang ${qte(p.rang!)}, la droite prévoit ${qte(Math.round(t.lineaire))} enceintes, l'exponentielle ${qte(Math.round(t.exponentiel))} : les deux formes ne se séparent qu'avec l'horizon. La puissance, elle, reste loin dessous dès le rang ${qte(RANGS_DU_LABORATOIRE.min)} : sa croissance ralentit trop.`,
          "Plus la prévision porte loin, plus le choix de la forme pèse. L'étape suivante calcule la courbe puissance.",
        ];
      },
    },
    {
      id: "l-ajustement-puissance",
      objectifs: [2],
      type: "montants",
      titre: "L'ajustement puissance",
      notions: ["seasonality"],
      question: () => {
        const { puissance: p } = correlationEtLissage();
        return `Posons X = ln t et Y = ln y : y = b × t^a devient Y = a X + ln b, une droite. Sur les 12 trimestres bruts, X̄ = ${dec(p.xMoyen, 4)}, Ȳ = ${dec(p.yMoyen, 4)}, Σ (X − X̄)(Y − Ȳ) = ${dec(p.sxy, 4)} et Σ (X − X̄)² = ${dec(p.sxx, 4)}. Calculez a (au dix-millième), ln b et b, puis la tendance du rang 13, à l'enceinte.`;
      },
      champs: () => {
        const { puissance: p } = correlationEtLissage();
        const k = puissanceALaMain(p);
        return [
          { libelle: "Exposant a", nature: "coefficient", attendu: k.a, tolerance: 0.0005, calcul: `${dec(p.sxy, 4)} ÷ ${dec(p.sxx, 4)} = ${dec(k.a, 4)}` },
          { libelle: "ln b", nature: "coefficient", attendu: k.lnB, tolerance: 0.001, calcul: `${dec(p.yMoyen, 4)} − ${dec(k.a, 4)} × ${dec(p.xMoyen, 4)} = ${dec(k.lnB, 4)}` },
          { libelle: "b, en enceintes", nature: "grandeur", attendu: k.b, calcul: `e^${dec(k.lnB, 4)} = ${qte(k.b)}` },
          { libelle: "Tendance du rang 13, en enceintes", nature: "quantite", attendu: k.rang13, calcul: `${qte(k.b)} × 13^${dec(k.a, 4)} = ${qte(k.exact13)}, à l'enceinte : ${qte(k.rang13)}` },
        ];
      },
      explication: () => {
        const { puissance: p, brute } = correlationEtLissage();
        const k = puissanceALaMain(p);
        return [
          `La tendance puissance est y = ${qte(k.b)} × t^${dec(k.a, 4)}. Au rang 13, elle prévoit ${qte(k.rang13)} enceintes, quand la droite en prévoit ${qte(brute.droite.en(13))} : un exposant de ${dec(p.a, 2)} freine trop la croissance.`,
        ];
      },
    },
    {
      id: "le-choix-de-l-ajustement",
      objectifs: [3],
      type: "choix",
      titre: "Trois tendances, deux séries",
      notions: ["seasonality"],
      tableau: () => tableauDesCorrelations(),
      question: () => "Le tableau donne le coefficient de corrélation de chaque ajustement, sur la série brute et sur la série CVS. Que concluez-vous pour la tendance du marché ?",
      options: () => {
        const { r } = correlationEtLissage();
        return [
          { texte: "Écarter la puissance : sa croissance ralentit trop", juste: true, retour: `Oui. Sur la série CVS, la droite (${dec(r.cvs.lineaire, 3)}) et l'exponentielle (${dec(r.cvs.exponentiel, 3)}) se valent, la puissance (${dec(r.cvs.puissance, 3)}) décroche. Entre les deux premières, la forme décide : des hausses annuelles presque égales, la droite du chapitre précédent.` },
          { texte: "La puissance : elle colle mieux aux premiers trimestres de la série", juste: false, retour: `Non : son coefficient est le plus faible des trois, sur les deux séries. Et elle finit trop bas : au rang 12, ${qte(Math.round(tendancesAuRang(12).puissance))} enceintes, contre ${qte(Math.round(tendancesAuRang(12).lineaire))} pour la droite.` },
          { texte: "L'exponentielle, sans hésiter : son coefficient sur la CVS est le plus fort", juste: false, retour: "Non : l'écart avec la droite est au millième. Un coefficient ne départage pas deux formes aussi proches ; la forme de la croissance, si." },
        ];
      },
    },
    {
      id: "le-lissage",
      type: "lecture",
      titre: "Le lissage exponentiel",
      notions: ["seasonality"],
      tableau: () => tableauDesParticuliers(),
      texte: () => [
        "Les ventes en ligne aux particuliers montent, creusent en août, remontent vers Noël : ni droite nette, ni saison mesurée sur une seule année. Pour prévoir le mois suivant, le lissage exponentiel corrige chaque prévision par l'erreur qu'elle vient de faire.",
        `Prévision du mois suivant = α × ventes du mois + (1 − α) × prévision du mois, avec α entre 0 et 1, la constante de lissage. La première prévision, celle de février, est la vente de janvier, ${qte(VENTES_LISSEES[0]!)} enceintes.`,
      ],
      repere: () => "P(m + 1) = α × V(m) + (1 − α) × P(m) = P(m) + α × [V(m) − P(m)] : la nouvelle prévision rattrape une part α de la dernière erreur.",
    },
    {
      id: "predire-alpha",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur α",
      question: () => "Avant de calculer, pariez : plus la constante de lissage α est grande…",
      options: () => [
        { texte: "Plus la prévision suit le dernier mois", juste: true, retour: "Bon pari : avec α proche de 1, la prévision recopie presque la dernière vente ; avec α proche de 0, elle bouge à peine. Le laboratoire suivant cherche le juste milieu pour cette série." },
        { texte: "Plus la prévision est lisse, d'un mois à l'autre", juste: false, retour: "Non : c'est l'inverse. Un petit α lisse beaucoup ; un grand α suit chaque à-coup." },
        { texte: "Plus la prévision tient compte des mois les plus anciens", juste: false, retour: "Non : un grand α donne tout son poids au dernier mois, et oublie vite les anciens." },
      ],
    },
    {
      id: "le-lissage-a-la-main",
      objectifs: [4],
      type: "a-completer",
      titre: "Le lissage à la main",
      notions: ["seasonality"],
      question: () => `Avec α = ${qte(ALPHA_A_LA_MAIN)}, calculez les prévisions de mars à juin, puis l'erreur de chaque mois, la vente moins la prévision. Février est donné.`,
      grille: () => grilleDuLissage(),
      explication: () => {
        const { main } = correlationEtLissage();
        const juin = main.mois[MOIS_A_LA_MAIN - 1]!;
        return [
          `Au printemps, les ventes montent et la prévision les suit en retard : l'erreur de juin est encore de ${qte(juin.erreur)} enceintes. Avec α = ${qte(ALPHA_A_LA_MAIN)}, la prévision ne rattrape que ${qte(ALPHA_A_LA_MAIN * 100)} % de chaque erreur.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-lissage",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du lissage",
      notions: ["seasonality"],
      question: () =>
        "Choisissez la constante de lissage α. Le tableau suit la somme des carrés des erreurs de février à décembre, l'écart moyen et la prévision de janvier N + 1 ; le graphique suit la somme des carrés selon α. Relevez le défi.",
      leviers: () => [{ code: "alpha", libelle: "Constante de lissage α", unite: "", ...ALPHAS, depart: ALPHA_A_LA_MAIN }],
      lecture: (_, p) => {
        const l = lissage(p.alpha!);
        const depart = lissage(ALPHA_A_LA_MAIN);
        return [
          { libelle: "Somme des carrés des erreurs, en milliers", montant: Math.round(l.sommeDesCarres / 10) / 100, unite: "milliers", reference: Math.round(depart.sommeDesCarres / 10) / 100, fort: true },
          { libelle: "Écart moyen d'une prévision", montant: Math.round(l.ecartMoyen * 100) / 100, unite: "enceintes" },
          { libelle: "Prévision de janvier N + 1", montant: Math.round(l.prochaine * 100) / 100, unite: "enceintes" },
        ];
      },
      graphique: () => ({ levier: "alpha", unite: "milliers", courbes: [{ libelle: "Somme des carrés des erreurs", valeur: (p) => Math.round(lissage(p.alpha!).sommeDesCarres / 10) / 100 }] }),
      montrer: "Montrer α",
      defi: () => {
        const a = meilleurAlpha();
        return {
          consigne: "Trouvez la constante de lissage, au dixième, qui rend la somme des carrés des erreurs la plus petite.",
          atteint: (p) => Math.abs(p.alpha! - a) < 1e-9,
          indice: (p) => {
            const ici = lissage(p.alpha!).sommeDesCarres;
            const plus = p.alpha! + ALPHAS.pas <= ALPHAS.max + 1e-9 ? lissage(Math.round((p.alpha! + ALPHAS.pas) * 10) / 10).sommeDesCarres : Infinity;
            return plus < ici ? "Un α un peu plus grand fait encore baisser les erreurs : montez." : "Les erreurs remontent au-delà : essayez un α un peu plus petit.";
          },
          solution: { alpha: a },
        };
      },
      explication: (_, p) => {
        const l = lissage(p.alpha!);
        return [
          `À α = ${qte(p.alpha!)}, la somme des carrés tombe à ${qte(Math.round(l.sommeDesCarres))} : cette série change de niveau souvent, une prévision qui la suit de près s'y trompe le moins. Le fond de la courbe est plat : de ${qte(p.alpha! - ALPHAS.pas)} à ${qte(p.alpha! + ALPHAS.pas)}, les erreurs se valent presque.`,
          `La prévision de janvier N + 1 est alors de ${qte(Math.round(l.prochaine * 100) / 100)} enceintes. L'étape suivante la calcule.`,
        ];
      },
    },
    {
      id: "la-prevision-de-janvier",
      objectifs: [4],
      type: "montants",
      titre: "La prévision de janvier N + 1",
      notions: ["seasonality"],
      question: () => {
        const { lisse, alpha } = correlationEtLissage();
        const dec_ = lisse.mois.at(-1)!;
        return `Avec α = ${qte(alpha)}, la prévision de décembre N était de ${qte(Math.round(dec_.prevision * 100) / 100)} enceintes, et décembre en a vendu ${qte(dec_.vente)}. Calculez l'erreur de décembre, puis la prévision de janvier N + 1, au centième.`;
      },
      champs: () => {
        const { lisse, alpha } = correlationEtLissage();
        const d = lisse.mois.at(-1)!;
        const p = Math.round(d.prevision * 100) / 100;
        return [
          { libelle: "Erreur de décembre", nature: "grandeur", attendu: Math.round(d.erreur * 100) / 100, calcul: `${qte(d.vente)} − ${qte(p)} = ${qte(Math.round(d.erreur * 100) / 100)}` },
          { libelle: "Prévision de janvier N + 1", nature: "grandeur", attendu: Math.round(lisse.prochaine * 100) / 100, calcul: `${qte(alpha)} × ${qte(d.vente)} + ${qte(Math.round((1 - alpha) * 10) / 10)} × ${qte(p)} = ${qte(Math.round(lisse.prochaine * 100) / 100)}` },
        ];
      },
      explication: () => {
        const { lisse, alpha } = correlationEtLissage();
        const d = lisse.mois.at(-1)!;
        return [`La prévision rattrape ${qte(alpha * 100)} % de l'erreur de décembre : ${qte(Math.round(d.prevision * 100) / 100)} + ${qte(alpha)} × ${qte(Math.round(d.erreur * 100) / 100)} = ${qte(Math.round(lisse.prochaine * 100) / 100)} enceintes.`];
      },
    },
    {
      id: "ce-que-le-lissage-ne-voit-pas",
      objectifs: [3, 4],
      type: "choix",
      titre: "Ce que le lissage ne voit pas",
      notions: ["seasonality"],
      question: () => {
        const { lisse } = correlationEtLissage();
        return `Le lissage annonce ${qte(Math.round(lisse.prochaine))} enceintes en ligne pour janvier N + 1, plus que tout mois de N sauf décembre. Janvier N en avait vendu ${qte(VENTES_LISSEES[0]!)}. Pourquoi s'en méfier ?`;
      },
      options: () => [
        { texte: "Il ne voit pas la saison", juste: true, retour: "Oui. Le lissage simple prolonge le dernier niveau, celui de Noël ; il ignore que janvier est un creux. Sur une série saisonnière, on lisse la série CVS, puis on rend au mois son coefficient." },
        { texte: `La constante α = ${qte(meilleurAlpha())} est trop faible pour suivre Noël`, juste: false, retour: "Non : un α plus fort collerait encore plus à décembre, et prévoirait janvier plus haut encore." },
        { texte: "Le lissage ne marche que pour des ventes qui montent", juste: false, retour: "Non : c'est l'inverse, il convient aux séries sans tendance nette. Ce qui lui manque ici, c'est la saison." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["seasonality"],
      texte: () => {
        const { brute, cvs, puissance: p, alpha } = correlationEtLissage();
        return [
          `Le coefficient de corrélation mesure l'alignement des points : ${dec(brute.r, 3)} sur le marché brut, ${dec(cvs.r, 3)} sur la série CVS. La saison brouille la tendance ; r ne dit ni la cause, ni la meilleure forme.`,
          `L'ajustement puissance, y = b × t^a, se calcule par les moindres carrés sur (ln t ; ln y) : ici a = ${dec(p.a, 4)}, une croissance qui ralentit trop pour ce marché. Le choix d'un ajustement compare les coefficients, puis la forme de la croissance.`,
          `Le lissage exponentiel prévoit le mois suivant : P(m + 1) = α V(m) + (1 − α) P(m). On choisit α par la plus petite somme des carrés des erreurs, ${qte(alpha)} ici ; il ne voit ni tendance forte ni saison.`,
          "Dans l'arène, la demande de votre entreprise arrive tour après tour : la méthode, elle, est la même.",
        ];
      },
      repere: () => "r = Σ (t − t̄)(y − ȳ) ÷ √[Σ (t − t̄)² Σ (y − ȳ)²]. Puissance : ln y = a ln t + ln b. Lissage : P(m + 1) = P(m) + α [V(m) − P(m)].",
    },
  ],
};
