import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import {
  ajustementExponentiel,
  ajustementLineaire,
  aLUnite,
  auDixieme,
  coefficientsSaisonniers,
  moyennesMobilesDuMarche,
  novaEnN,
  previsionDeNPlus1,
  serieDuMarche,
  totauxAnnuels,
  type AjustementDeTendance,
  type TrimestreDuMarche,
} from "../monde/prevision-des-ventes";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : PRÉVOIR LES VENTES : TENDANCE ET SAISONS (contrôle de gestion, palier 4 ; BTS CG P5
 * 5.4.1, DCG UE11 § 3.2, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA à la fin de N prévoit ses ventes de N + 1. Elle n'a
 * qu'une année d'histoire ; le marché des enceintes en a trois. Le modèle (monde/prevision-des-ventes.ts)
 * ajuste la tendance du marché par les moindres carrés, lisse la série par les moyennes mobiles
 * centrées, tire les coefficients saisonniers par la méthode des rapports à la tendance, prévoit le
 * marché de chaque trimestre de N + 1 et y applique la part de marché de NOVA. La prévision, arrondie
 * à la centaine, est la demande de N + 1 des chapitres de la capacité (nova-capacite.ts).
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui du BTS CG et du DCG) :
 *   · guidé : le-point-moyen, la-droite (les sommes sont dans la question), les-moyennes-mobiles (la
 *     formule est au repère) ;
 *   · l'expérience avant la formule : predire-la-droite (un pari), puis le-laboratoire-des-carres
 *     (l'élève cherche la pente qui rend la somme des carrés la plus petite) avant la-droite, qui
 *     donne la formule ; le-laboratoire-de-la-prevision (l'ajustement et la part de marché, avec un
 *     graphique) avant ce-que-la-prevision-annonce ;
 *   · autonome : les-rapports-a-la-tendance, la-prevision-du-marche, la-part-de-nova,
 *     la-prevision-de-l-annee (sans formule ; le calcul de chaque case se lit une fois l'étape réussie) ;
 *   · expert : le-choix-de-l-ajustement (comparer deux tendances et justifier), plus-loin-que-n-plus-1
 *     (prolonger la tendance, et ce que vaut une prévision lointaine) ; puis la synthèse.
 */

/** La prévision se calcule sur le marché de NOVA, que le monde du cours tient sur trois années. */
export const ENTREPRISES_DE_LA_PREVISION: readonly string[] = ["nova"];

/** Le laboratoire des carrés : la pente essayée, en enceintes par trimestre. */
export const PENTES_DU_LABORATOIRE = { min: 600, max: 900, pas: 10 } as const;

/** Le laboratoire de la prévision : la part de marché de NOVA en N + 1, en %. */
export const PARTS_DU_LABORATOIRE = { min: 22, max: 28, pas: 0.1 } as const;

/** Les deux ajustements du levier à choix. */
export const AJUSTEMENTS_DU_LABORATOIRE: readonly { valeur: number; ajustement: AjustementDeTendance; libelle: string }[] = [
  { valeur: 0, ajustement: "lineaire", libelle: "Ajustement linéaire" },
  { valeur: 1, ajustement: "exponentiel", libelle: "Ajustement exponentiel" },
];

/** Le rang du trimestre que l'étape experte prévoit : le premier de N + 2. */
export const RANG_DE_N_PLUS_2 = 17;

const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const dec3 = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const pct = (p: number) => `${qte(p, 1)} %`;
const NOMS = ["1er trimestre", "2e trimestre", "3e trimestre", "4e trimestre"] as const;
const nomDe = (x: Pick<TrimestreDuMarche, "annee" | "trimestre">) => `${NOMS[x.trimestre - 1]} de ${x.annee}`;

const donnee = (valeur: number, unite = "enceintes"): CelluleACompleter => ({ valeur, unite });
const texte = (valeur: number, t: string): CelluleACompleter => ({ valeur, texte: t });
const VIDE: CelluleACompleter = { valeur: null };
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** La somme des carrés des écarts à une droite de pente a qui passe par le point moyen. */
export function sommeDesCarres(a: number) {
  const d = ajustementLineaire();
  const b = d.yMoyen - a * d.tMoyen;
  return { a, b, somme: serieDuMarche().reduce((t, x) => t + (x.marche - (a * x.rang + b)) ** 2, 0) };
}

/** La part de marché la plus haute, au cran du laboratoire, qui laisse chaque trimestre prévu dans la ligne. */
export function plusHautePartDansLaLigne(ajustement: AjustementDeTendance = "lineaire") {
  const { min, max, pas } = PARTS_DU_LABORATOIRE;
  for (let i = Math.round((max - min) / pas); i >= 0; i--) {
    const part = Math.round((min + i * pas) * 1e6) / 1e6;
    if (previsionDeNPlus1({ ajustement, part }).auDelaDeLaLigne === 0) return part;
  }
  return min;
}

/** Tout ce que le chapitre lit, calculé une fois. */
export function prevision() {
  const serie = serieDuMarche();
  const lin = ajustementLineaire();
  const exp = ajustementExponentiel();
  const mm = moyennesMobilesDuMarche();
  const k = coefficientsSaisonniers("lineaire");
  const ke = coefficientsSaisonniers("exponentiel");
  const n = novaEnN();
  const p = previsionDeNPlus1();
  const pe = previsionDeNPlus1({ ajustement: "exponentiel" });
  const an = totauxAnnuels();
  return { serie, lin, exp, mm, k, ke, n, p, pe, an };
}

const ajustementDe = (v: number) => AJUSTEMENTS_DU_LABORATOIRE.find((x) => x.valeur === v)!;

/** Le marché de trois années, trimestre par trimestre : le document du chapitre. */
function tableauDuMarche(): TableauDeDonnees {
  const { serie, an } = prevision();
  return {
    titre: "Les enceintes vendues sur tout le marché, par trimestre",
    colonnes: ["N − 2", "N − 1", "N"],
    lignes: [
      ...NOMS.map((nom, q) => ({ libelle: nom, valeurs: ["N − 2", "N − 1", "N"].map((a) => qte(serie.find((x) => x.annee === a && x.trimestre === q + 1)!.marche)) })),
      { libelle: "Total de l'année", valeurs: an.totaux.map((t) => qte(t)) },
    ],
  };
}

/** NOVA en N, face au marché. */
function tableauDeNova(): TableauDeDonnees {
  const { n } = prevision();
  return {
    titre: "NOVA et le marché, en N",
    colonnes: ["Ventes de NOVA", "Marché", "Part de NOVA"],
    lignes: [
      ...NOMS.map((nom, q) => ({ libelle: nom, valeurs: [qte(n.ventes[q]!), qte(n.marche[q]!), pct(n.parts[q]!)] })),
      { libelle: "Année N", valeurs: [qte(n.total), qte(n.marcheTotal), "à calculer"] },
    ],
  };
}

/** La tendance de chaque trimestre de la série. */
function tableauDesTendances(): TableauDeDonnees {
  const { lin } = prevision();
  return {
    titre: `La tendance du marché : y = ${qte(lin.a)} t + ${qte(lin.b)}`,
    colonnes: ["N − 2", "N − 1", "N"],
    lignes: NOMS.map((nom, q) => ({ libelle: nom, valeurs: [0, 1, 2].map((i) => qte(lin.en(4 * i + q + 1))) })),
  };
}

/** Les deux ajustements, face à face. */
function tableauDesAjustements(): TableauDeDonnees {
  const { lin, exp, an, p, pe } = prevision();
  return {
    titre: "Deux tendances pour le même marché",
    colonnes: ["Linéaire", "Exponentiel"],
    lignes: [
      { libelle: "Équation", valeurs: [`y = ${qte(lin.a)} t + ${qte(lin.b)}`, `y = ${qte(exp.B, 0)} × ${qte(exp.A, 4)}^t`] },
      { libelle: "Coefficient de corrélation linéaire", valeurs: [qte(lin.r, 3), `${qte(exp.r, 3)} (sur ln y)`] },
      { libelle: "Ce que la tendance suppose", valeurs: [`${qte(lin.a)} enceintes de plus par trimestre`, `${pct(auDixieme((exp.A - 1) * 100))} de plus par trimestre`] },
      { libelle: "Hausse du marché, de N − 2 à N − 1, puis de N − 1 à N", valeurs: [`${qte(an.hausses[0]!)} puis ${qte(an.hausses[1]!)} enceintes`, `${pct(an.taux[0]!)} puis ${pct(an.taux[1]!)}`] },
      { libelle: "Ventes de NOVA prévues pour N + 1", valeurs: [qte(p.nova), qte(pe.nova)] },
    ],
  };
}

/** Les moyennes mobiles centrées : quatre à calculer, les autres données. */
function grilleDesMoyennesMobiles(): TableauACompleter {
  const { serie, mm } = prevision();
  const aCalculer = new Set([3, 4, 9, 10]);
  return {
    titre: "Les moyennes mobiles centrées sur 4 trimestres",
    colonnes: ["Marché", "Moyenne mobile centrée"],
    lignes: serie.map((x, i) => {
      const m = mm[i];
      let cellule: CelluleACompleter = VIDE;
      if (m !== null && m !== undefined) {
        const s = serie;
        const calcul = `(${qte(s[i - 2]!.marche)} ÷ 2 + ${qte(s[i - 1]!.marche)} + ${qte(x.marche)} + ${qte(s[i + 1]!.marche)} + ${qte(s[i + 2]!.marche)} ÷ 2) ÷ 4 = ${qte(m)}`;
        cellule = aCalculer.has(x.rang) ? aSaisir(m, calcul, { indice: "la moitié des 2 trimestres extrêmes, les 3 du milieu en entier, le tout divisé par 4" }) : { ...donnee(m), calcul };
      }
      return { libelle: `${nomDe(x)} (rang ${x.rang})`, cellules: [donnee(x.marche), cellule] };
    }),
  };
}

/** Les rapports à la tendance de N, et les coefficients saisonniers. */
function grilleDesRapports(): TableauACompleter {
  const { k } = prevision();
  const rapport = (annee: string, q: number) => k.serie.find((x) => x.annee === annee && x.trimestre === q)!;
  return {
    titre: "Les rapports à la tendance, au millième",
    colonnes: ["N − 2", "N − 1", "N", "Coefficient saisonnier"],
    lignes: [
      ...NOMS.map((nom, i) => {
        const q = i + 1;
        const [r2, r1, r0] = [rapport("N − 2", q), rapport("N − 1", q), rapport("N", q)];
        return {
          libelle: nom,
          cellules: [
            texte(r2.rapport, dec3(r2.rapport)),
            texte(r1.rapport, dec3(r1.rapport)),
            aSaisir(r0.rapport, `${qte(r0.marche)} ÷ ${qte(r0.tendance)} = ${dec3(r0.rapport)}`, { tolerance: 0.001, indice: "le marché du trimestre divisé par sa tendance" }),
            aSaisir(k.coefficients[i]!, `(${dec3(r2.rapport)} + ${dec3(r1.rapport)} + ${dec3(r0.rapport)}) ÷ 3 = ${dec3(k.coefficients[i]!)}`, { tolerance: 0.001, indice: "la moyenne des rapports du même trimestre, sur les 3 années" }),
          ],
        };
      }),
      {
        libelle: "Somme des coefficients",
        fort: true,
        totalDe: { plus: [0, 1, 2, 3] },
        cellules: [VIDE, VIDE, VIDE, aSaisir(k.sommeBrute, `${k.coefficients.map(dec3).join(" + ")} = ${dec3(k.sommeBrute)}`, { tolerance: 0.001 })],
      },
    ],
  };
}

/** La prévision des quatre trimestres de N + 1. */
function grilleDeLAnnee(): TableauACompleter {
  const { p, lin } = prevision();
  const part = p.leviers.part;
  return {
    titre: "La prévision de N + 1, trimestre par trimestre",
    colonnes: ["Tendance", "Coefficient", "Marché prévu", "Ventes de NOVA prévues"],
    lignes: [
      ...p.trimestres.map((x) => ({
        libelle: `${NOMS[x.trimestre - 1]} de N + 1 (rang ${x.rang})`,
        cellules: [
          aSaisir(x.tendance, `${qte(lin.a)} × ${x.rang} + ${qte(lin.b)} = ${qte(x.tendance)}`, { unite: "enceintes", indice: "la droite de tendance, au rang du trimestre" }),
          texte(x.coefficient, dec3(x.coefficient)),
          aSaisir(x.marche, `${qte(x.tendance)} × ${dec3(x.coefficient)} = ${qte(x.tendance * x.coefficient)}, soit ${qte(x.marche)}`, { unite: "enceintes", tolerance: 1, indice: "la tendance multipliée par le coefficient du trimestre, à l'enceinte" }),
          aSaisir(x.nova, `${qte(x.marche)} × ${pct(part)} = ${qte((x.marche * part) / 100)}, soit ${qte(x.nova)}`, { unite: "enceintes", tolerance: 1, indice: "le marché prévu multiplié par la part de NOVA, à l'enceinte" }),
        ],
      })),
      {
        libelle: "Année N + 1",
        fort: true,
        totalDe: { plus: [0, 1, 2, 3] },
        cellules: [VIDE, VIDE, aSaisir(p.marche, `${p.trimestres.map((x) => qte(x.marche)).join(" + ")} = ${qte(p.marche)}`, { unite: "enceintes", tolerance: 1 }), aSaisir(p.nova, `${p.trimestres.map((x) => qte(x.nova)).join(" + ")} = ${qte(p.nova)}`, { unite: "enceintes", tolerance: 1 })],
      },
    ],
  };
}

/** Le laboratoire de la prévision, à une position des leviers. */
export function laboratoireDeLaPrevision(valeurDeLAjustement: number, part: number) {
  return previsionDeNPlus1({ ajustement: ajustementDe(valeurDeLAjustement).ajustement, part });
}

export const LA_PREVISION_DES_VENTES: Chapitre = {
  code: "la-prevision-des-ventes",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Prévoir les ventes : tendance et saisons",
  accroche:
    "NOVA prévoit ses ventes de N + 1 sur trois années du marché des enceintes : la droite des moindres carrés, les moyennes mobiles, les coefficients saisonniers par les rapports à la tendance, puis sa part de marché. Et la prévision dit déjà ce que la ligne ne pourra pas monter.",
  objectifs: [
    "Ajuster une tendance linéaire par la méthode des moindres carrés et la prolonger",
    "Lisser une série trimestrielle par les moyennes mobiles centrées",
    "Calculer des coefficients saisonniers par la méthode des rapports à la tendance",
    "Prévoir les ventes d'un trimestre à partir de la tendance, de la saison et d'une part de marché",
    "Choisir entre un ajustement linéaire et un ajustement exponentiel, et justifier la prévision retenue",
  ],
  libre: false,
  prerequis: ["marche-et-part-de-marche"],
  ensuite: ["le-cout-preetabli-et-les-budgets", "croitre-en-investissant", "correlation-et-lissage"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_PREVISION,
    pourquoi:
      "la prévision se calcule ici sur le marché des enceintes de NOVA, que la simulation du cours tient sur trois années ; la méthode vaut pour toute entreprise qui a un historique.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une année d'histoire, trois années de marché",
      notions: ["seasonality", "demand_market_share"],
      tableau: () => tableauDuMarche(),
      texte: () => {
        const { n, an } = prevision();
        return [
          `Fin N, NOVA prépare N + 1 : combien d'enceintes vendra-t-elle chaque trimestre ? Elle n'a qu'une année d'histoire, ${qte(n.total)} enceintes en N. Une seule année ne sépare pas ce qui grandit de ce qui revient chaque année : la tendance de la saison.`,
          `Le marché des enceintes, lui, a trois années de relevés, de N − 2 à N (tableau). Il a vendu ${qte(an.totaux[2]!)} enceintes en N, et chaque année a ses creux, l'hiver et l'été, et ses pics, le printemps et Noël.`,
          "La démarche est celle d'une jeune entreprise : prévoir le marché de chaque trimestre de N + 1, puis y appliquer la part de marché de NOVA. Pour le marché, trois outils : la droite des moindres carrés pour la tendance, les moyennes mobiles pour voir la série sans sa saison, les rapports à la tendance pour mesurer la saison.",
        ];
      },
      repere: () => "Le rang t numérote les trimestres : 1 pour le 1er trimestre de N − 2, 12 pour le 4e de N, 13 à 16 pour N + 1. Prévision = tendance du rang × coefficient saisonnier du trimestre.",
    },
    {
      id: "predire-la-droite",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur la droite",
      notions: ["seasonality"],
      question: () =>
        "La droite des moindres carrés est celle qui passe au plus près des 12 trimestres : la somme des carrés de ses écarts aux ventes est la plus petite possible. Avant de la chercher, pariez : elle passe forcément par…",
      options: () => [
        { texte: "Le point moyen de la série", juste: true, retour: "Bon pari : la droite des moindres carrés passe toujours par le point moyen, le rang moyen et les ventes moyennes. Le laboratoire suivant fait tourner une droite autour de ce point." },
        { texte: "Le premier et le dernier trimestre de la série", juste: false, retour: "Non : une droite tracée par deux points ignore les dix autres. Celle des moindres carrés tient compte de tous, et passe par leur point moyen." },
        { texte: "Le trimestre le plus fort de chacune des 3 années", juste: false, retour: "Non : ces trimestres sont des pics de saison. La tendance passe entre les pics et les creux, par le point moyen de la série." },
      ],
    },
    {
      id: "le-point-moyen",
      objectifs: [0],
      type: "montants",
      titre: "Le point moyen",
      notions: ["seasonality"],
      tableau: () => tableauDuMarche(),
      question: () => "Calculez le point moyen de la série : le rang moyen des 12 trimestres, et leurs ventes moyennes.",
      champs: () => {
        const { lin, an } = prevision();
        return [
          { libelle: "Rang moyen", attendu: lin.tMoyen, calcul: `(1 + 2 + … + 12) ÷ 12 = 78 ÷ 12 = ${qte(lin.tMoyen)}` },
          { libelle: "Ventes moyennes d'un trimestre, en enceintes", attendu: lin.yMoyen, calcul: `(${an.totaux.map((t) => qte(t)).join(" + ")}) ÷ 12 = ${qte(lin.yMoyen)}` },
        ];
      },
      explication: () => {
        const { lin } = prevision();
        return [`Le point moyen est (${qte(lin.tMoyen)} ; ${qte(lin.yMoyen)}). Toute droite des moindres carrés passe par lui : il reste à trouver sa pente.`];
      },
    },
    {
      id: "le-laboratoire-des-carres",
      objectifs: [0],
      type: "simulation",
      titre: "Le laboratoire des carrés",
      notions: ["seasonality"],
      question: () => {
        const { lin } = prevision();
        return `Faites tourner la droite autour du point moyen (${qte(lin.tMoyen)} ; ${qte(lin.yMoyen)}) : choisissez sa pente, en enceintes gagnées par trimestre. Le tableau suit la somme des carrés des écarts entre la droite et les 12 trimestres ; le graphique la montre selon la pente. Relevez le défi.`;
      },
      leviers: () => [{ code: "pente", libelle: "Pente de la droite", unite: "enceintes par trimestre", min: PENTES_DU_LABORATOIRE.min, max: PENTES_DU_LABORATOIRE.max, pas: PENTES_DU_LABORATOIRE.pas, depart: PENTES_DU_LABORATOIRE.min }],
      lecture: (_, p) => {
        const s = sommeDesCarres(p.pente!);
        const depart = sommeDesCarres(PENTES_DU_LABORATOIRE.min);
        return [
          { libelle: "Ordonnée à l'origine b", montant: Math.round(s.b * 100) / 100, unite: "enceintes" },
          { libelle: "Tendance du 1er trimestre de N + 1 (rang 13)", montant: aLUnite(13 * s.a + s.b), unite: "enceintes" },
          { libelle: "Somme des carrés des écarts", montant: Math.round(s.somme / 10_000) / 100, unite: "millions", reference: Math.round(depart.somme / 10_000) / 100, fort: true },
        ];
      },
      graphique: () => ({ levier: "pente", unite: "millions", courbes: [{ libelle: "Somme des carrés des écarts", valeur: (p) => Math.round(sommeDesCarres(p.pente!).somme / 10_000) / 100 }] }),
      montrer: "Montrer la pente",
      defi: () => {
        const meilleure = Math.round(ajustementLineaire().a);
        return {
          consigne: "Trouvez la pente qui rend la somme des carrés des écarts la plus petite.",
          atteint: (p) => p.pente === meilleure,
          indice: (p) => {
            const ici = sommeDesCarres(p.pente!).somme;
            const plus = sommeDesCarres(p.pente! + PENTES_DU_LABORATOIRE.pas).somme;
            return plus < ici ? "Une pente un peu plus forte rapproche encore la droite des trimestres : montez." : "La somme des carrés remonte à partir d'ici : une pente un peu plus faible fait mieux.";
          },
          solution: { pente: meilleure },
        };
      },
      explication: (_, p) => {
        const s = sommeDesCarres(p.pente!);
        return [
          `À ${qte(s.a)} enceintes par trimestre, la somme des carrés tombe à son minimum : c'est la pente des moindres carrés. Plus faible, la droite passe trop bas à la fin de la série ; plus forte, trop bas au début.`,
          "Le graphique est une parabole : la somme des carrés baisse puis remonte. L'étape suivante trouve le fond sans tâtonner, par une formule.",
        ];
      },
    },
    {
      id: "la-droite",
      objectifs: [0],
      type: "montants",
      titre: "La droite des moindres carrés",
      notions: ["seasonality"],
      question: () => {
        const { lin } = prevision();
        return `Sur les 12 trimestres, Σ (t − t̄)(y − ȳ) = ${qte(lin.sxy)} et Σ (t − t̄)² = ${qte(lin.sxx)}. Calculez la pente a = Σ (t − t̄)(y − ȳ) ÷ Σ (t − t̄)², puis l'ordonnée à l'origine b = ȳ − a × t̄.`;
      },
      champs: () => {
        const { lin } = prevision();
        return [
          { libelle: "Pente a, en enceintes par trimestre", attendu: lin.a, calcul: `${qte(lin.sxy)} ÷ ${qte(lin.sxx)} = ${qte(lin.a)}` },
          { libelle: "Ordonnée à l'origine b", attendu: lin.b, calcul: `${qte(lin.yMoyen)} − ${qte(lin.a)} × ${qte(lin.tMoyen)} = ${qte(lin.b)}` },
        ];
      },
      explication: () => {
        const { lin } = prevision();
        return [
          `La tendance du marché est y = ${qte(lin.a)} t + ${qte(lin.b)} : le marché gagne ${qte(lin.a)} enceintes par trimestre, saison mise à part. C'est la pente que le laboratoire a trouvée en tâtonnant.`,
          `Prolongée, elle donne la tendance de chaque trimestre à venir : au rang 13, le 1er trimestre de N + 1, ${qte(lin.en(13))} enceintes.`,
        ];
      },
    },
    {
      id: "les-moyennes-mobiles",
      objectifs: [1],
      type: "a-completer",
      titre: "Les moyennes mobiles centrées",
      notions: ["seasonality"],
      question: () =>
        "Une moyenne mobile centrée sur 4 trimestres couvre une année entière autour de son trimestre : la saison s'y compense. Calculez les 4 moyennes à compléter, au rang 3 et 4, puis 9 et 10.",
      grille: () => grilleDesMoyennesMobiles(),
      explication: () => {
        const { mm } = prevision();
        return [
          `Les moyennes mobiles montent de ${qte(mm[2]!)} au rang 3 à ${qte(mm[9]!)} au rang 10, sans les creux ni les pics de la série brute. Les 2 premiers et les 2 derniers trimestres n'en ont pas : il leur manque une moitié d'année d'un côté.`,
        ];
      },
    },
    {
      id: "ce-que-montrent-les-moyennes",
      objectifs: [1],
      type: "choix",
      titre: "Ce que montrent les moyennes mobiles",
      notions: ["seasonality"],
      question: () => "Les moyennes mobiles centrées montent régulièrement, quand la série brute monte et descend. Que montrent-elles ?",
      options: () => [
        { texte: "La tendance, sans la saison", juste: true, retour: "Oui. Chaque moyenne couvre une année : un creux et un pic s'y compensent, il ne reste que la tendance. C'est pourquoi elles servent à voir si la droite est la bonne forme." },
        { texte: "Les ventes corrigées des erreurs de relevé", juste: false, retour: "Non : les relevés ne sont pas faux. Les moyennes effacent la saison, qui revient chaque année, pas des erreurs." },
        { texte: "La part de marché de NOVA, trimestre après trimestre", juste: false, retour: "Non : ce sont des moyennes du marché tout entier. NOVA n'y entre qu'à la fin, par sa part." },
      ],
    },
    {
      id: "les-rapports-a-la-tendance",
      objectifs: [2],
      type: "a-completer",
      titre: "Les rapports à la tendance",
      notions: ["seasonality"],
      tableau: () => tableauDesTendances(),
      question: () =>
        "Divisez chaque trimestre de N par sa tendance (tableau), au millième. Puis le coefficient saisonnier de chaque trimestre : la moyenne de ses 3 rapports, au millième. Enfin, la somme des 4 coefficients.",
      grille: () => grilleDesRapports(),
      explication: () => {
        const { k } = prevision();
        return [
          `Le printemps vend ${pct(auDixieme((k.coefficients[1]! - 1) * 100))} de plus que la tendance, Noël ${pct(auDixieme((k.coefficients[3]! - 1) * 100))} ; l'hiver ${pct(auDixieme((1 - k.coefficients[0]!) * 100))} de moins. Le 1er trimestre de N a été faible (${dec3(k.serie[8]!.rapport)}) : la moyenne sur 3 années l'atténue.`,
        ];
      },
    },
    {
      id: "la-saison-se-compense",
      objectifs: [2],
      type: "choix",
      titre: "Une somme de 4",
      notions: ["seasonality"],
      question: () => {
        const { k } = prevision();
        return `Les 4 coefficients font ${dec3(k.sommeBrute)}. Que dit cette somme ?`;
      },
      options: () => [
        { texte: "La saison se compense sur l'année", juste: true, retour: "Oui. Ce que les pics prennent au-dessus de la tendance, les creux le rendent : sur une année, la saison n'ajoute ni n'enlève rien. Si la somme s'écartait de 4, on corrigerait chaque coefficient (× 4 ÷ la somme)." },
        { texte: "Le marché grandit de 4 % par an, saison comprise", juste: false, retour: "Non : la croissance est dans la tendance, pas dans les coefficients. Ceux-ci ne mesurent que la saison." },
        { texte: "Chaque trimestre pèse le quart des ventes de l'année", juste: false, retour: "Non : le printemps et Noël pèsent plus que l'hiver et l'été. C'est la moyenne des coefficients qui vaut 1, pas chacun." },
      ],
    },
    {
      id: "la-prevision-du-marche",
      objectifs: [3],
      type: "montants",
      titre: "Le marché du 1er trimestre de N + 1",
      notions: ["seasonality"],
      question: () => "Prévoyez le marché du 1er trimestre de N + 1 : sa tendance, puis la prévision, à l'enceinte.",
      champs: () => {
        const { p, lin } = prevision();
        const t = p.trimestres[0]!;
        return [
          { libelle: "Tendance du rang 13, en enceintes", attendu: t.tendance, calcul: `${qte(lin.a)} × 13 + ${qte(lin.b)} = ${qte(t.tendance)}` },
          { libelle: "Marché prévu, en enceintes", attendu: t.marche, tolerance: 1, calcul: `${qte(t.tendance)} × ${dec3(t.coefficient)} = ${qte(t.tendance * t.coefficient)}, soit ${qte(t.marche)}` },
        ];
      },
      explication: () => {
        const { p, n } = prevision();
        return [`Le marché devrait vendre ${qte(p.trimestres[0]!.marche)} enceintes de janvier à mars N + 1, contre ${qte(n.marche[0]!)} en N : la tendance a monté, et la saison de l'hiver la retient.`];
      },
    },
    {
      id: "la-part-de-nova",
      objectifs: [3],
      type: "montants",
      titre: "La part de NOVA",
      notions: ["demand_market_share"],
      tableau: () => tableauDeNova(),
      question: () => "NOVA garde en N + 1 sa part de marché de l'année N. Calculez cette part, au dixième, puis les ventes de NOVA prévues au 1er trimestre de N + 1, à l'enceinte, et le plan de production arrondi à la centaine.",
      champs: () => {
        const { p, n } = prevision();
        const t = p.trimestres[0]!;
        return [
          { libelle: "Part de marché de NOVA en N, en %", attendu: n.part, tolerance: 0.05, calcul: `${qte(n.total)} ÷ ${qte(n.marcheTotal)} = ${pct(n.part)}` },
          { libelle: "Ventes de NOVA prévues, en enceintes", attendu: t.nova, tolerance: 1, calcul: `${qte(t.marche)} × ${pct(n.part)} = ${qte((t.marche * n.part) / 100)}, soit ${qte(t.nova)}` },
          { libelle: "Plan à la centaine, en enceintes", attendu: t.plan, calcul: `${qte(t.nova)} arrondies à la centaine : ${qte(t.plan)}` },
        ];
      },
      explication: () => {
        const { p, n } = prevision();
        return [
          `Une part de l'année, pas d'un trimestre : celle de NOVA a varié de ${pct(Math.min(...n.parts))} à ${pct(Math.max(...n.parts))} selon les trimestres, et l'année lisse ces écarts. Les ${qte(p.trimestres[0]!.plan)} enceintes du plan sont la demande du 1er trimestre de N + 1 que lisent les chapitres de la capacité.`,
        ];
      },
    },
    {
      id: "la-prevision-de-l-annee",
      objectifs: [3],
      type: "a-completer",
      titre: "Les 4 trimestres de N + 1",
      notions: ["seasonality", "demand_market_share"],
      question: () => {
        const { p } = prevision();
        return `Remplissez la prévision des 4 trimestres de N + 1 : la tendance du rang, le marché prévu (à l'enceinte), puis les ventes de NOVA à ${pct(p.leviers.part)} du marché (à l'enceinte), et les totaux de l'année.`;
      },
      grille: () => grilleDeLAnnee(),
      explication: () => {
        const { p, n } = prevision();
        return [
          `NOVA devrait vendre ${qte(p.nova)} enceintes en N + 1, ${pct(auDixieme((p.nova / n.total - 1) * 100))} de plus qu'en N. Arrondi à la centaine, le plan fait ${p.trimestres.map((x) => qte(x.plan)).join(", ")} enceintes : ${qte(p.plan)} sur l'année.`,
        ];
      },
    },
    {
      id: "le-choix-de-l-ajustement",
      objectifs: [4],
      type: "choix",
      titre: "Linéaire ou exponentiel",
      notions: ["seasonality"],
      tableau: () => tableauDesAjustements(),
      question: () =>
        "Une tendance exponentielle suppose que le marché grandit d'un même pourcentage chaque trimestre ; la droite, d'une même quantité. Le tableau compare les deux. Laquelle retenez-vous pour prévoir N + 1 ?",
      options: () => {
        const { lin, exp } = prevision();
        return [
          { texte: "La droite : la hausse annuelle ne bouge presque pas", juste: true, retour: `Oui. Le marché gagne à peu près la même quantité chaque année, et son taux de croissance baisse : c'est une croissance linéaire. Les deux coefficients de corrélation (${qte(lin.r, 3)} et ${qte(exp.r, 3)}) se valent : la saison pèse plus que la forme de la tendance.` },
          { texte: "L'exponentielle : son coefficient de corrélation est un peu plus fort", juste: false, retour: "Non : l'écart est infime, et les deux coefficients sont abaissés par la saison. Ce qui départage, c'est la forme de la croissance : des hausses en quantités presque égales, des taux qui baissent." },
          { texte: "L'exponentielle : un marché qui grandit grandit toujours plus vite", juste: false, retour: "Non : rien ne le dit ici, au contraire. Le taux de croissance annuel baisse d'une année à l'autre ; l'exponentielle prolongerait une accélération que la série ne montre pas." },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-prevision",
      objectifs: [3, 4],
      type: "simulation",
      titre: "Le laboratoire de la prévision",
      notions: ["seasonality", "demand_market_share", "capacity"],
      question: () =>
        "Choisissez l'ajustement de la tendance et la part de marché de NOVA en N + 1. Le tableau suit les ventes prévues de chaque trimestre et ce qui dépasse la ligne de montage ; le graphique montre la prévision du 4e trimestre selon la part, pour les deux ajustements. Relevez le défi.",
      leviers: () => [
        {
          code: "ajustement",
          libelle: "Tendance du marché",
          unite: "",
          min: 0,
          max: AJUSTEMENTS_DU_LABORATOIRE.length - 1,
          pas: 1,
          depart: 0,
          choix: AJUSTEMENTS_DU_LABORATOIRE.map((x) => ({ valeur: x.valeur, libelle: x.libelle })),
        },
        { code: "part", libelle: "Part de marché de NOVA en N + 1", unite: "%", min: PARTS_DU_LABORATOIRE.min, max: PARTS_DU_LABORATOIRE.max, pas: PARTS_DU_LABORATOIRE.pas, depart: novaEnN().part },
      ],
      lecture: (_, p) => {
        const depart = previsionDeNPlus1();
        const l = laboratoireDeLaPrevision(p.ajustement!, p.part!);
        return [
          ...l.trimestres.map((x, i) => ({ libelle: `Ventes prévues, ${NOMS[x.trimestre - 1]}`, montant: x.nova, unite: "enceintes", reference: depart.trimestres[i]!.nova })),
          { libelle: "Ventes prévues de l'année", montant: l.nova, unite: "enceintes", reference: depart.nova },
          { libelle: `Au-delà des ${qte(l.capacite)} enceintes que la ligne monte par trimestre`, montant: l.auDelaDeLaLigne, unite: "enceintes", reference: depart.auDelaDeLaLigne, fort: true },
        ];
      },
      graphique: () => ({
        levier: "part",
        unite: "enceintes",
        courbes: [
          ...AJUSTEMENTS_DU_LABORATOIRE.map((x) => ({ libelle: `4e trimestre, ${x.libelle.toLowerCase()}`, valeur: (p: Readonly<Record<string, number>>) => laboratoireDeLaPrevision(x.valeur, p.part!).trimestres[3]!.nova })),
          { libelle: "Capacité de la ligne", valeur: () => previsionDeNPlus1().capacite },
        ],
      }),
      defi: () => {
        const part = plusHautePartDansLaLigne("lineaire");
        return {
          consigne: "Avec la tendance que vous avez retenue, trouvez la plus haute part de marché pour laquelle aucun trimestre prévu ne dépasse la ligne de montage.",
          atteint: (p) => p.ajustement === 0 && Math.abs(p.part! - part) < 1e-9,
          indice: (p) => {
            if (p.ajustement !== 0) return "Reprenez la tendance que l'étape précédente a retenue : la droite.";
            const l = laboratoireDeLaPrevision(p.ajustement, p.part!);
            return l.auDelaDeLaLigne > 0
              ? `À ${pct(p.part!)}, ${qte(l.auDelaDeLaLigne)} enceintes prévues dépassent la ligne : baissez la part.`
              : `À ${pct(p.part!)}, tout tient dans la ligne, mais un cran de plus tiendrait encore peut-être : essayez plus haut.`;
          },
          solution: { ajustement: 0, part },
        };
      },
      montrer: "Montrer la part",
      explication: (_, p) => {
        const { n } = prevision();
        const l = laboratoireDeLaPrevision(0, p.part!);
        return [
          `À ${pct(p.part!)} du marché, Noël prévoit ${qte(l.trimestres[3]!.nova)} enceintes : la ligne suffit. Pour y tenir, NOVA renoncerait à ${qte(auDixieme(n.part - p.part!), 1)} points de la part qu'elle a gagnée en N, soit ${qte(previsionDeNPlus1().nova - l.nova)} enceintes sur l'année.`,
          "Avec l'exponentielle, la courbe du 4e trimestre est plus haute : la même ligne tiendrait une part plus faible encore. La prévision ne décide pas : elle dit au président où est le goulot, avant qu'il ne coûte des ventes.",
        ];
      },
    },
    {
      id: "ce-que-la-prevision-annonce",
      objectifs: [3],
      type: "choix",
      titre: "Ce que la prévision annonce",
      notions: ["capacity", "seasonality"],
      question: () => {
        const { p } = prevision();
        return `La ligne monte ${qte(p.capacite)} enceintes par trimestre. À sa part de N, que dit la prévision de N + 1 ?`;
      },
      options: () => {
        const { p } = prevision();
        return [
          { texte: "Le printemps et Noël dépassent la ligne", juste: true, retour: `Oui : ${qte(p.trimestres[1]!.nova)} et ${qte(p.trimestres[3]!.nova)} enceintes prévues, pour ${qte(p.capacite)}. Le plan, à la centaine, en laisse ${qte(p.trimestres[1]!.plan + p.trimestres[3]!.plan - 2 * p.capacite)} sans enceinte. C'est la question des chapitres de la capacité : produire avant, sous-traiter, ou investir.` },
          { texte: "Aucun trimestre : la prévision se fait à la centaine près", juste: false, retour: `Non : l'arrondi ne change pas l'ordre de grandeur. Le 4e trimestre prévoit ${qte(p.trimestres[3]!.nova)} enceintes, bien au-dessus de la ligne.` },
          { texte: `Seul Noël dépasse : le printemps reste sous les ${qte(p.capacite)} enceintes`, juste: false, retour: `Non : le printemps prévoit ${qte(p.trimestres[1]!.nova)} enceintes, au-dessus de la ligne lui aussi.` },
        ];
      },
    },
    {
      id: "plus-loin-que-n-plus-1",
      objectifs: [0, 3],
      type: "montants",
      titre: "Plus loin que N + 1",
      notions: ["seasonality", "demand_market_share"],
      question: () => "La banque demande une prévision du 1er trimestre de N + 2, au même rythme et à la même part. Calculez la tendance du rang 17, le marché prévu et les ventes de NOVA, chacun à l'enceinte.",
      champs: () => {
        const { lin, k, n } = prevision();
        const t = lin.en(RANG_DE_N_PLUS_2);
        const marche = aLUnite(t * k.coefficients[0]!);
        const nova = aLUnite((marche * n.part) / 100);
        return [
          { libelle: "Tendance du rang 17, en enceintes", attendu: t, calcul: `${qte(lin.a)} × ${RANG_DE_N_PLUS_2} + ${qte(lin.b)} = ${qte(t)}` },
          { libelle: "Marché prévu, en enceintes", attendu: marche, tolerance: 1, calcul: `${qte(t)} × ${dec3(k.coefficients[0]!)} = ${qte(t * k.coefficients[0]!)}, soit ${qte(marche)}` },
          { libelle: "Ventes de NOVA prévues, en enceintes", attendu: nova, tolerance: 1, calcul: `${qte(marche)} × ${pct(n.part)} = ${qte((marche * n.part) / 100)}, soit ${qte(nova)}` },
        ];
      },
      explication: () => [
        "Le calcul est le même, la confiance non : plus on prolonge la tendance loin des relevés, plus une rupture a de temps pour la démentir (un concurrent, une mode qui passe, une hausse des prix). Une prévision se refait chaque trimestre, avec le dernier relevé.",
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["seasonality", "demand_market_share"],
      texte: () => {
        const { lin, k, p } = prevision();
        return [
          `La tendance du marché est la droite des moindres carrés, y = ${qte(lin.a)} t + ${qte(lin.b)}, qui passe par le point moyen. Les moyennes mobiles centrées montrent la série sans sa saison. Les coefficients saisonniers, ${k.coefficients.map(dec3).join(", ")}, sont la moyenne des rapports à la tendance, et font 4 sur l'année.`,
          `Prévision d'un trimestre = tendance de son rang × son coefficient ; celle de NOVA, le marché prévu × sa part. N + 1 prévoit ${qte(p.nova)} enceintes pour NOVA, ${qte(p.plan)} au plan : plus que la ligne au printemps et à Noël.`,
          "Choisir la tendance, c'est regarder la forme de la croissance : des hausses en quantités égales donnent une droite, des hausses en pourcentages égaux une exponentielle.",
          "Dans l'arène, la demande de votre entreprise se lit tour après tour : la méthode, elle, est la même.",
        ];
      },
      repere: () => "a = Σ (t − t̄)(y − ȳ) ÷ Σ (t − t̄)² ; b = ȳ − a t̄. Rapport à la tendance = ventes ÷ tendance ; coefficient = moyenne des rapports du trimestre. Prévision = (a t + b) × coefficient.",
    },
  ],
};
