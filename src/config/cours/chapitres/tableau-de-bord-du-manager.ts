import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { budgetDuTrimestre, chiffreDAffairesParLesIndicateurs, indicateursDuMois, tableauDeBordDuManager, voyantAllume } from "../monde/boutique";
import { BOUTIQUES_DU_COURS, type CodeDIndicateurDuManager, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";
import { equipeEtPlanning } from "./equipe-et-planning";

/**
 * CHAPITRE : LE TABLEAU DE BORD DU MANAGER (BTS MCO, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique
 * MAILLE & CO a une fiche figée (monde/maille-et-co.ts : janvier N, janvier N − 1, le budget du
 * trimestre, les seuils d'alerte du manager) et un modèle (monde/boutique.ts, `tableauDeBordDuManager`).
 * Une évolution du moteur ne change rien ici.
 *
 * L'objet : le dernier chapitre du parcours rassemble les indicateurs des précédents. Il les range par
 * ce qu'ils surveillent, compare janvier N à janvier N − 1 et à l'objectif, et lit les voyants : deux
 * sont rouges, la réalisation de l'objectif (90,5 %) et le trafic (−7,5 %). Puis il remonte à la cause :
 * le chiffre d'affaires est le trafic × le taux de transformation × le panier moyen ; le trafic manque,
 * mais ceux qui entrent achètent mieux qu'en N − 1.
 *
 * Le piège central : le voyant qui s'allume n'est pas toujours celui qui explique. L'objectif est manqué
 * à cause du trafic ; la transformation et le panier, eux, progressent. Et un voyant éteint par un autre
 * levier (la transformation) n'éteint pas la cause (le trafic reste rouge).
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, ranger, evolutions, l-objectif (la formule est au repère ou dans la question) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-trafic puis
 *     le-trafic-qui-manque (un curseur sur les entrées, le chiffre d'affaires face au seuil du voyant)
 *     avant les-ratios ; predire-sans-trafic puis le-laboratoire-des-voyants (trafic, transformation et
 *     panier en % de janvier ; un graphique de trois voyants qui ne bougent pas au même rythme) avant
 *     la-transformation-qui-eteint ;
 *   · autonome : les-ratios, le-voyant-rouge, la-transformation-qui-eteint (ni formule ni chiffres à
 *     prendre donnés ; le calcul de la correction montre le chemin) ;
 *   · expert : decomposer-l-ecart (l'écart de chiffre d'affaires en effet trafic, transformation et
 *     panier, qui se recomposent), a-rebours (retrouver le panier de février à partir du taux de
 *     réalisation, du trafic et de la transformation), critique-de-l-objectif (une critique de la
 *     méthode : un objectif mensuel au tiers du trimestre) ; puis la synthèse.
 *
 * Ce qui a disparu : les deux trimestres de l'arène ramenés à un mois, la « demande adressée » et le
 * « taux de transformation » compté en ventes ÷ demande (ce n'est pas la définition du BTS MCO : c'est
 * le taux de service). Le distracteur faible « la demande progresse » est remplacé par des erreurs
 * réelles (le nombre de passages lu à la place du taux, le recul du chiffre d'affaires pris pour un
 * recul du panier, le taux de service pris pour un voyant).
 */

/**
 * FÉVRIER, À REBOURS (hypothèse du cours) : le manager ne connaît de février que trois chiffres, un
 * taux de réalisation de l'objectif de 97 %, 3 700 entrées et un taux de transformation de 25 %.
 * L'objectif de février est, comme celui de janvier, le tiers du budget du trimestre.
 */
export const FEVRIER_A_REBOURS = { realisation: 0.97, entrees: 3_700, transformation: 0.25 } as const;

/** Les bornes du curseur des entrées du mois. */
export const ENTREES_DU_CURSEUR = { min: 3_500, max: 4_500 } as const;

/** Les leviers du laboratoire des voyants, en % de janvier N. */
export const LEVIERS_DES_VOYANTS = { min: 80, max: 120, pas: 0.5 } as const;

export const ENTREPRISES_DU_TABLEAU_DE_BORD: readonly string[] = ["boutique"];

export const AXES_DU_TABLEAU = [
  { code: "vendre", libelle: "Vendre" },
  { code: "rentabilite", libelle: "Rentabilité" },
  { code: "stock", libelle: "Stock et trésorerie" },
  { code: "equipe", libelle: "Équipe" },
] as const;

type Axe = (typeof AXES_DU_TABLEAU)[number]["code"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number, decimales = 2) => n.toLocaleString("fr-FR", { maximumFractionDigits: decimales }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);
const evolution = (a: number, b: number) => auDixieme((b / a - 1) * 100);

/** La fiche de la boutique du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Ce que chaque indicateur du tableau de bord dit, et comment l'écrire. */
const INDICATEURS: Readonly<Record<CodeDIndicateurDuManager, { libelle: string; axe: Axe; ecrire: (v: number) => string }>> = {
  realisationDeLObjectif: { libelle: "Réalisation de l'objectif", axe: "vendre", ecrire: (v) => pct(auDixieme(v * 100)) },
  evolutionDuTrafic: { libelle: "Évolution du trafic sur janvier N − 1", axe: "vendre", ecrire: (v) => pct(auDixieme(v * 100)) },
  tauxDeTransformation: { libelle: "Taux de transformation", axe: "vendre", ecrire: (v) => pct(auDixieme(v * 100)) },
  panierMoyen: { libelle: "Panier moyen", axe: "vendre", ecrire: (v) => eur(auCentime(v)) },
  indiceDeVente: { libelle: "Indice de vente", axe: "vendre", ecrire: (v) => qte(auCentime(v)) },
  tauxDeService: { libelle: "Taux de service", axe: "stock", ecrire: (v) => pct(auDixieme(v * 100)) },
  tauxDeMarque: { libelle: "Taux de marque", axe: "rentabilite", ecrire: (v) => pct(auDixieme(v * 100)) },
  indiceDeSecurite: { libelle: "Indice de sécurité", axe: "rentabilite", ecrire: (v) => pct(auDixieme(v * 100)) },
  partDuPersonnel: { libelle: "Part du personnel dans le chiffre d'affaires", axe: "equipe", ecrire: (v) => pct(auDixieme(v * 100)) },
  dureeDeStockage: { libelle: "Durée moyenne de stockage", axe: "stock", ecrire: (v) => `${qte(Math.round(v))} jours` },
};

/** Le seuil d'alerte d'un indicateur, écrit pour l'élève. */
function seuilEcrit(code: CodeDIndicateurDuManager, f: FicheDeLaBoutique) {
  const s = f.seuilsDAlerte[code];
  return `${INDICATEURS[code].ecrire(s.seuil)} ${s.sens === "plancher" ? "au moins" : "au plus"}`;
}

/** Le tableau de bord de janvier et tout ce que le chapitre et son cas en tirent. */
export function tableauDeBordDuMois(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = tableauDeBordDuManager(f);
  const m = indicateursDuMois(f);
  const n1 = f.moisN1;
  const b = budgetDuTrimestre(f);
  const v = (code: CodeDIndicateurDuManager) => t.indicateurs.find((i) => i.code === code)!;
  const ca = t.chiffreDAffaires;
  const objectif = t.objectif;
  const seuilDeRealisation = f.seuilsDAlerte.realisationDeLObjectif.seuil;
  // Le chiffre d'affaires qui éteint le voyant de l'objectif : 95 % de l'objectif, sans arrondi pour le curseur.
  const caDuVoyant = objectif * seuilDeRealisation;
  const caParEntree = ca / m.entrees;
  const panierN1 = n1.chiffreDAffaires / n1.tickets;
  // La décomposition de l'écart sur N − 1 : trafic, puis transformation, puis panier.
  const passagesAuTauxN1 = (m.entrees * n1.tickets) / n1.trafic;
  const effetDuTrafic = auCentime((m.entrees - n1.trafic) * (n1.chiffreDAffaires / n1.trafic));
  const effetDeLaTransformation = auCentime((m.tickets - passagesAuTauxN1) * panierN1);
  const effetDuPanier = auCentime(ca - m.tickets * panierN1);
  // Février, à rebours.
  const caDeFevrier = auCentime(objectif * FEVRIER_A_REBOURS.realisation);
  const passagesDeFevrier = Math.round(FEVRIER_A_REBOURS.entrees * FEVRIER_A_REBOURS.transformation);
  const passagesNecessaires = plafond(caDuVoyant / m.panierMoyen);
  return {
    f,
    t,
    m,
    n1,
    v,
    ca,
    objectif,
    budgetDuTrimestre: b.ventesHt,
    seuilDeRealisation,
    evolutionDuCa: evolution(n1.chiffreDAffaires, ca),
    evolutionDuTrafic: evolution(n1.trafic, m.entrees),
    evolutionDesPassages: evolution(n1.tickets, m.tickets),
    ecartALObjectif: auCentime(ca - objectif),
    realisation: auDixieme((ca / objectif) * 100),
    caDuVoyant,
    caDuVoyantAuCentime: auCentime(caDuVoyant),
    caParEntree,
    entreesDuVoyant: plafond(caDuVoyant / caParEntree),
    hausseNecessaire: (caDuVoyant / ca - 1) * 100,
    transformationN: auDixieme(m.tauxDeTransformation * 100),
    transformationN1: auDixieme((n1.tickets / n1.trafic) * 100),
    panierN: auCentime(m.panierMoyen),
    panierN1: auCentime(panierN1),
    passagesNecessaires,
    transformationNecessaire: auDixieme((passagesNecessaires / m.entrees) * 100),
    passagesAuTauxN1,
    effetDuTrafic,
    effetDeLaTransformation,
    effetDuPanier,
    caDeFevrier,
    passagesDeFevrier,
    panierDeFevrier: auCentime(caDeFevrier / passagesDeFevrier),
    caParHeure: equipeEtPlanning(c).caParHeure,
  };
}

export type TableauDeBordDuMois = ReturnType<typeof tableauDeBordDuMois>;

/** Le laboratoire des voyants : trafic, transformation et panier en % de janvier N, tout le reste suit. */
export function laboratoireDesVoyants(x: TableauDeBordDuMois, p: { trafic: number; transformation: number; panier: number }) {
  const m = x.m;
  const leviers = {
    trafic: (m.entrees * p.trafic) / 100,
    tauxDeTransformation: (m.tauxDeTransformation * p.transformation) / 100,
    prixMoyenDeLArticle: (m.prixMoyenDeLArticle * p.panier) / 100,
  };
  const t = tableauDeBordDuManager(x.f, leviers);
  const k = chiffreDAffairesParLesIndicateurs(x.f, leviers);
  const v = (code: CodeDIndicateurDuManager) => t.indicateurs.find((i) => i.code === code)!;
  return {
    entrees: auCentime(k.trafic),
    transformation: auCentime(k.tauxDeTransformation * 100),
    passages: auDixieme(k.tickets),
    panier: auCentime(k.panierMoyen),
    chiffreDAffaires: t.chiffreDAffaires,
    realisation: auCentime(v("realisationDeLObjectif").valeur * 100),
    ecartALObjectif: auCentime(t.chiffreDAffaires - t.objectif),
    ecartSurN1: auCentime(t.chiffreDAffaires - t.chiffreDAffairesN1),
    indiceDeSecurite: auCentime(v("indiceDeSecurite").valeur * 100),
    partDuPersonnel: auCentime(v("partDuPersonnel").valeur * 100),
    voyants: t.voyantsAllumes.length,
    objectifEteint: !v("realisationDeLObjectif").voyant,
    traficAllume: v("evolutionDuTrafic").voyant,
  };
}

/** Janvier N − 1 et janvier N, côte à côte : le document des évolutions. */
export function tableauDesDeuxJanviers(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = tableauDeBordDuMois(c);
  return {
    titre: `${x.f.entreprise} · janvier N − 1 et janvier N`,
    colonnes: ["Janvier N − 1", "Janvier N"],
    lignes: [
      { libelle: "Entrées (trafic)", valeurs: [qte(x.n1.trafic), qte(x.m.entrees)] },
      { libelle: "Passages en caisse", valeurs: [qte(x.n1.tickets), qte(x.m.tickets)] },
      { libelle: "Articles vendus", valeurs: [qte(x.n1.articles), qte(x.m.articles)] },
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(x.n1.chiffreDAffaires), eur(x.ca)] },
    ],
  };
}

/** Les indicateurs du parcours, avec leur valeur de janvier, rangés par ce qu'ils surveillent. */
export function indicateursDuParcours(c: Pick<Cas, "code">) {
  const x = tableauDeBordDuMois(c);
  return [
    ...x.t.indicateurs.map((i) => ({ code: i.code as string, libelle: INDICATEURS[i.code].libelle, valeur: INDICATEURS[i.code].ecrire(i.valeur), axe: INDICATEURS[i.code].axe })),
    { code: "chiffreDAffairesParHeure", libelle: "Chiffre d'affaires par heure payée", valeur: eur(x.caParHeure), axe: "equipe" as Axe },
  ];
}

const POURQUOI_DE_L_AXE: Record<Axe, string> = {
  vendre: "Il dit si les clients viennent, achètent, et combien.",
  rentabilite: "Il dit si les ventes laissent assez pour payer les charges et gagner de l'argent.",
  stock: "Il dit si le stock sert la demande, et combien de temps l'argent y dort.",
  equipe: "Il dit ce que coûte l'équipe et ce qu'elle fait vendre.",
};

export const TABLEAU_DE_BORD_DU_MANAGER: Chapitre = {
  code: "tableau-de-bord-du-manager",
  parcours: "mco",
  palier: 4,
  blocs: ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle", "BUT TC · Piloter un espace de vente"],
  titre: "Le tableau de bord du manager",
  accroche:
    "Tous les indicateurs du parcours sur une seule page, comparés à janvier N − 1 et à l'objectif. Deux voyants sont rouges : lequel explique l'autre, et peut-on éteindre celui de l'objectif sans un client de plus ?",
  objectifs: [
    "Ranger les indicateurs du point de vente par ce qu'ils surveillent",
    "Comparer un mois à l'année précédente et à l'objectif : évolutions, écart, taux de réalisation",
    "Lire les voyants d'un tableau de bord et remonter à leur cause",
    "Décomposer l'écart de chiffre d'affaires en effet trafic, transformation et panier",
    "Retrouver un indicateur à rebours, et critiquer la façon dont un objectif est fixé",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TABLEAU_DE_BORD,
    pourquoi:
      "ce chapitre se joue à la boutique du cours, MAILLE & CO : son tableau de bord rassemble les indicateurs du point de vente calculés dans le parcours, sur le même mois de janvier.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une page, quelques voyants",
      notions: ["dashboard"],
      tableau: tableauDesDeuxJanviers,
      texte: (c) => {
        const x = tableauDeBordDuMois(c);
        const s = x.f.seuilsDAlerte;
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}, sur le mois de janvier de l'année N. Le manager n'a pas le temps de tout relire chaque semaine : son tableau de bord tient sur une page, une dizaine d'indicateurs, ceux que vous avez calculés dans ce parcours.`,
          `Ce que la simulation suppose. L'objectif du mois est le tiers du chiffre d'affaires budgété pour le trimestre, ${eur(x.budgetDuTrimestre)}. Janvier N se compare à janvier N − 1. Chaque indicateur a un seuil d'alerte posé par le manager : un voyant s'allume sous ${pct(s.realisationDeLObjectif.seuil * 100)} de réalisation de l'objectif, si le trafic perd plus de ${pct(-s.evolutionDuTrafic.seuil * 100)} sur N − 1, sous ${pct(s.tauxDeTransformation.seuil * 100)} de transformation, sous ${eur(s.panierMoyen.seuil)} de panier, au-dessus de ${pct(s.partDuPersonnel.seuil * 100)} de part du personnel.`,
          "Un tableau de bord ne sert pas à tout savoir : il sert à voir vite ce qui change, et à savoir quoi faire. Chaque indicateur répond à une question, et chaque question appelle une décision.",
        ];
      },
      repere: () => "Un indicateur n'a de sens que comparé : à la même période de l'an passé, à l'objectif, ou à un seuil du métier. Chiffre d'affaires = trafic × taux de transformation × panier moyen.",
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Ce que chaque indicateur surveille",
      notions: ["dashboard"],
      question: (c) =>
        `Voici les indicateurs de ${ficheDe(c).entreprise} en janvier. Rangez chacun selon ce qu'il surveille : vendre, la rentabilité, le stock et la trésorerie, ou l'équipe.`,
      categories: AXES_DU_TABLEAU,
      elements: (c) => indicateursDuParcours(c).map((l) => ({ libelle: `${l.libelle} : ${l.valeur}`, montant: 0, categorie: l.axe, pourquoi: POURQUOI_DE_L_AXE[l.axe] })),
      explication: () => [
        "Quatre familles de questions, quatre familles d'indicateurs. Le taux de service va avec le stock : il dit si le rayon a servi la demande, ce que le taux de transformation ne dit pas. Un bon tableau de bord garde deux ou trois indicateurs par famille : au-delà, plus personne ne le lit.",
      ],
    },
    {
      id: "evolutions",
      type: "montants",
      titre: "Janvier N face à janvier N − 1",
      notions: ["dashboard", "revenue"],
      tableau: tableauDesDeuxJanviers,
      question: () =>
        "Évolution = (valeur de N ÷ valeur de N − 1 − 1) × 100. Calculez, en pourcentage et au dixième, l'évolution du chiffre d'affaires, celle des entrées et celle des passages en caisse. Négatif pour un recul.",
      champs: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          { libelle: "Évolution du chiffre d'affaires (%)", attendu: x.evolutionDuCa, tolerance: 0.1, calcul: `(${eur(x.ca)} ÷ ${eur(x.n1.chiffreDAffaires)} − 1) × 100 = ${pct(x.evolutionDuCa)}` },
          { libelle: "Évolution des entrées (%)", attendu: x.evolutionDuTrafic, tolerance: 0.1, calcul: `(${qte(x.m.entrees)} ÷ ${qte(x.n1.trafic)} − 1) × 100 = ${pct(x.evolutionDuTrafic)}` },
          { libelle: "Évolution des passages en caisse (%)", attendu: x.evolutionDesPassages, tolerance: 0.1, calcul: `(${qte(x.m.tickets)} ÷ ${qte(x.n1.tickets)} − 1) × 100 = ${pct(x.evolutionDesPassages)}` },
        ];
      },
      explication: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          `Le chiffre d'affaires recule de ${pct(-x.evolutionDuCa)}, les entrées de ${pct(-x.evolutionDuTrafic)}, les passages en caisse de ${pct(-x.evolutionDesPassages)}. Les trois ne reculent pas autant : la boutique a perdu des visiteurs, moins des acheteurs, et moins encore des ventes.`,
        ];
      },
    },
    {
      id: "l-objectif",
      type: "montants",
      titre: "Janvier face à l'objectif",
      notions: ["dashboard", "revenue"],
      question: (c) => {
        const x = tableauDeBordDuMois(c);
        return `L'objectif du mois est le tiers du chiffre d'affaires budgété pour le trimestre (${eur(x.budgetDuTrimestre)}). Calculez-le, au centime, puis l'écart à l'objectif (réalisé − objectif) et le taux de réalisation (réalisé ÷ objectif × 100, au dixième). Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          { libelle: "Objectif du mois", attendu: x.objectif, calcul: `${eur(x.budgetDuTrimestre)} ÷ 3 = ${eur(x.objectif)}` },
          { libelle: "Écart à l'objectif", attendu: x.ecartALObjectif, calcul: `${eur(x.ca)} − ${eur(x.objectif)} = ${eur(x.ecartALObjectif)}` },
          { libelle: "Taux de réalisation (%)", attendu: x.realisation, tolerance: 0.1, calcul: `${eur(x.ca)} ÷ ${eur(x.objectif)} × 100 = ${pct(x.realisation)}` },
        ];
      },
      explication: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          `${x.f.entreprise} a réalisé ${pct(x.realisation)} de son objectif de janvier : il manque ${eur(-x.ecartALObjectif)}. Sous ${pct(x.seuilDeRealisation * 100)}, le voyant est rouge. Le trafic, à ${pct(x.evolutionDuTrafic)} sur N − 1, allume le second.`,
        ];
      },
    },
    {
      id: "predire-le-trafic",
      type: "choix",
      titre: "Pariez sur le trafic",
      notions: ["dashboard", "conversion_rate"],
      question: (c) => {
        const x = tableauDeBordDuMois(c);
        return `Avant de calculer, pariez. Pour éteindre le voyant de l'objectif (${pct(x.seuilDeRealisation * 100)} de réalisation) par le seul trafic, à transformation et panier de janvier N, il faudrait…`;
      },
      options: (c) => {
        const x = tableauDeBordDuMois(c);
        const voir = "Faites varier les entrées à l'étape suivante : le curseur montre où le chiffre d'affaires franchit le seuil du voyant.";
        return [
          { texte: `Moins d'entrées qu'en janvier N − 1 (${qte(x.n1.trafic)})`, juste: x.entreesDuVoyant < x.n1.trafic, retour: `Bon pari. ${voir}` },
          { texte: `Plus d'entrées qu'en janvier N − 1 (${qte(x.n1.trafic)})`, juste: x.entreesDuVoyant > x.n1.trafic, retour: `Pari à vérifier. ${voir}` },
          { texte: `Exactement les entrées de janvier N − 1`, juste: x.entreesDuVoyant === x.n1.trafic, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-trafic-qui-manque",
      type: "curseur",
      titre: "Le trafic qui manque",
      notions: ["dashboard", "conversion_rate"],
      question: (c) => {
        const x = tableauDeBordDuMois(c);
        return `Faites varier les entrées du mois de ${qte(ENTREES_DU_CURSEUR.min)} à ${qte(ENTREES_DU_CURSEUR.max)}, la transformation et le panier restant ceux de janvier N : chaque entrée rapporte ${eur(auCentime(x.caParEntree))} de chiffre d'affaires. Placez le curseur sur le plus petit nombre d'entrées où le chiffre d'affaires atteint ${pct(x.seuilDeRealisation * 100)} de l'objectif (${eur(x.caDuVoyantAuCentime)}), puis validez.`;
      },
      grandeur: () => ({ libelle: "Entrées du mois", unite: "entrées" }),
      cible: (c) => ({ attendu: tableauDeBordDuMois(c).entreesDuVoyant, min: ENTREES_DU_CURSEUR.min, max: ENTREES_DU_CURSEUR.max }),
      zones: ["Voyant de l'objectif éteint", "Voyant de l'objectif allumé"],
      rates: () => ({
        dessous: "À ce trafic, le chiffre d'affaires reste sous le seuil du voyant : il manque des entrées.",
        dessus: "Plus bas, le voyant est encore éteint : cherchez le plus petit nombre d'entrées.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, n) => {
        const x = tableauDeBordDuMois(c);
        const ca = auCentime(n * x.caParEntree);
        return [
          { libelle: "Chiffre d'affaires du mois", montant: ca },
          { libelle: `${pct(x.seuilDeRealisation * 100)} de l'objectif`, montant: x.caDuVoyantAuCentime },
          { libelle: "Chiffre d'affaires de janvier N − 1", montant: x.n1.chiffreDAffaires },
          { libelle: "Marge sur le seuil du voyant", montant: auCentime(ca - x.caDuVoyantAuCentime), fort: true },
        ];
      },
      droites: (c) => {
        const x = tableauDeBordDuMois(c);
        return { produit: (n) => n * x.caParEntree, cout: () => x.caDuVoyant, libelles: ["Chiffre d'affaires des entrées", `${pct(x.seuilDeRealisation * 100)} de l'objectif`] };
      },
      explication: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          `Il faudrait ${qte(x.entreesDuVoyant)} entrées : ${qte(x.entreesDuVoyant - x.m.entrees)} de plus qu'en janvier N, et ${qte(x.n1.trafic - x.entreesDuVoyant)} de moins qu'en janvier N − 1. Avec le trafic de l'an passé, la boutique aurait éteint les deux voyants : ceux qui entrent achètent mieux qu'il y a un an.`,
          "C'est ce que l'étape suivante fait chiffrer : la transformation et le panier, de N − 1 à N.",
        ];
      },
    },
    {
      id: "les-ratios",
      type: "montants",
      titre: "Ceux qui entrent achètent-ils moins ?",
      notions: ["conversion_rate", "average_basket"],
      tableau: tableauDesDeuxJanviers,
      question: () =>
        "Sans formule cette fois. Calculez le taux de transformation de janvier N et de janvier N − 1 (en pourcentage, au dixième), puis le panier moyen de chacun (au centime).",
      champs: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          { libelle: "Taux de transformation de janvier N (%)", attendu: x.transformationN, tolerance: 0.1, calcul: `${qte(x.m.tickets)} passages ÷ ${qte(x.m.entrees)} entrées × 100 = ${pct(x.transformationN)}` },
          { libelle: "Taux de transformation de janvier N − 1 (%)", attendu: x.transformationN1, tolerance: 0.1, calcul: `${qte(x.n1.tickets)} ÷ ${qte(x.n1.trafic)} × 100 = ${pct(x.transformationN1)}` },
          { libelle: "Panier moyen de janvier N", attendu: x.panierN, tolerance: 0.01, calcul: `${eur(x.ca)} ÷ ${qte(x.m.tickets)} = ${eur(x.panierN)}` },
          { libelle: "Panier moyen de janvier N − 1", attendu: x.panierN1, calcul: `${eur(x.n1.chiffreDAffaires)} ÷ ${qte(x.n1.tickets)} = ${eur(x.panierN1)}` },
        ];
      },
      explication: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          `La transformation passe de ${pct(x.transformationN1)} à ${pct(x.transformationN)}, le panier de ${eur(x.panierN1)} à ${eur(x.panierN)} : ceux qui entrent achètent plus souvent et plus cher qu'en N − 1. Le chiffre d'affaires est le trafic × la transformation × le panier : ${qte(x.m.entrees)} × ${pct(auCentime(x.m.tauxDeTransformation * 100))} × ${eur(x.panierN)} ≈ ${eur(x.ca)}.`,
        ];
      },
    },
    {
      id: "le-voyant-rouge",
      type: "choix",
      titre: "Le voyant qui explique",
      notions: ["dashboard", "conversion_rate"],
      question: (c) => {
        const x = tableauDeBordDuMois(c);
        return `Chiffre d'affaires ${pct(x.evolutionDuCa)}, entrées ${pct(x.evolutionDuTrafic)}, passages en caisse ${pct(x.evolutionDesPassages)}, taux de service ${pct(auDixieme(x.m.tauxDeService * 100))} pour ${pct(auDixieme((x.n1.articles / x.n1.demande) * 100))} en N − 1. Qu'est-ce qui explique l'objectif manqué, et que faire ?`;
      },
      options: (c) => {
        const x = tableauDeBordDuMois(c);
        const trafic = x.v("evolutionDuTrafic").voyant && x.transformationN > x.transformationN1 && x.panierN > x.panierN1;
        return [
          {
            texte: "Le trafic : il faut faire venir, ceux qui entrent achètent mieux",
            juste: trafic,
            retour: trafic
              ? `Oui. Les entrées perdent ${pct(-x.evolutionDuTrafic)} ; la transformation monte de ${pct(x.transformationN1)} à ${pct(x.transformationN)} et le panier de ${eur(x.panierN1)} à ${eur(x.panierN)}. Le voyant est sur l'attractivité : la vitrine, la communication, la rue.`
              : "Non : le trafic n'est pas seul en cause ici.",
          },
          {
            texte: `La transformation : ${qte(x.m.tickets)} passages contre ${qte(x.n1.tickets)}, l'équipe conclut moins`,
            juste: false,
            retour: `Non : c'est lire le nombre de passages au lieu du taux. Rapportés aux entrées, ${qte(x.m.tickets)} passages font ${pct(x.transformationN)}, contre ${pct(x.transformationN1)} en N − 1 : l'équipe conclut mieux.`,
          },
          {
            texte: "Le panier : le chiffre d'affaires recule, chaque client dépense moins",
            juste: false,
            retour: `Non : le chiffre d'affaires recule parce qu'il y a moins d'acheteurs. Chacun dépense ${eur(x.panierN)}, contre ${eur(x.panierN1)} en N − 1.`,
          },
          {
            texte: "Le stock : le taux de service baisse, des clients repartent sans article",
            juste: false,
            retour: `Non : le taux de service, ${pct(auDixieme(x.m.tauxDeService * 100))}, reste au-dessus de son seuil de ${pct(x.f.seuilsDAlerte.tauxDeService.seuil * 100)} : son voyant est vert. Les ${qte(x.m.ventesManquees)} ventes manquées du cardigan ne font que ${eur(x.m.chiffreDAffairesManque)}, loin des ${eur(-x.ecartALObjectif)} qui manquent à l'objectif.`,
          },
        ];
      },
    },
    {
      id: "predire-sans-trafic",
      type: "choix",
      titre: "Pariez sans un client de plus",
      notions: ["dashboard", "conversion_rate"],
      question: (c) => {
        const x = tableauDeBordDuMois(c);
        return `Pariez encore. Sans une entrée de plus (${qte(x.m.entrees)}), de combien faut-il relever le taux de transformation, à panier égal, pour éteindre le voyant de l'objectif (${pct(x.realisation)} de réalisation aujourd'hui) ?`;
      },
      options: (c) => {
        const x = tableauDeBordDuMois(c);
        const voir = "Le laboratoire de l'étape suivante fait jouer le trafic, la transformation et le panier ensemble : vérifiez-le.";
        const besoin = Math.round(x.hausseNecessaire);
        return [
          { texte: `D'environ ${qte(besoin)} %, ce qui manque au chiffre d'affaires`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `De ${pct(-x.evolutionDuTrafic)}, ce que le trafic a perdu`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `De ${pct(auDixieme(100 - x.realisation))}, ce qui manque à l'objectif`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-voyants",
      type: "simulation",
      titre: "Le laboratoire des voyants",
      notions: ["dashboard", "conversion_rate", "average_basket"],
      question: () =>
        "Faites jouer les trois leviers du chiffre d'affaires, en % de janvier N : le trafic, le taux de transformation, le panier moyen. Le tableau de bord suit : le chiffre d'affaires, la réalisation de l'objectif, les voyants allumés. Relevez le défi, et regardez quel voyant reste rouge.",
      leviers: () => [
        { code: "trafic", libelle: "Trafic, en % de janvier", unite: "%", ...LEVIERS_DES_VOYANTS, depart: 100 },
        { code: "transformation", libelle: "Taux de transformation, en % de janvier", unite: "%", ...LEVIERS_DES_VOYANTS, depart: 100 },
        { code: "panier", libelle: "Panier moyen, en % de janvier", unite: "%", ...LEVIERS_DES_VOYANTS, depart: 100 },
      ],
      lecture: (c, p) => {
        const x = tableauDeBordDuMois(c);
        const l = laboratoireDesVoyants(x, { trafic: p.trafic!, transformation: p.transformation!, panier: p.panier! });
        const d = laboratoireDesVoyants(x, { trafic: 100, transformation: 100, panier: 100 });
        return [
          { libelle: "Entrées", montant: l.entrees, reference: d.entrees, unite: "entrées" },
          { libelle: "Taux de transformation", montant: l.transformation, reference: d.transformation, unite: "%" },
          { libelle: "Passages en caisse", montant: l.passages, reference: d.passages, unite: "passages" },
          { libelle: "Panier moyen", montant: l.panier, reference: d.panier },
          { libelle: "Chiffre d'affaires", montant: l.chiffreDAffaires, reference: d.chiffreDAffaires, fort: true },
          { libelle: "Réalisation de l'objectif", montant: l.realisation, reference: d.realisation, unite: "%" },
          { libelle: "Écart à l'objectif", montant: l.ecartALObjectif, reference: d.ecartALObjectif, effet: true },
          { libelle: "Écart sur janvier N − 1", montant: l.ecartSurN1, reference: d.ecartSurN1, effet: true },
          { libelle: "Voyants allumés", montant: l.voyants, reference: d.voyants, unite: "voyants" },
        ];
      },
      // Trois voyants que la transformation fait bouger, et pas au même rythme : la réalisation suit le
      // chiffre d'affaires en droite, l'indice de sécurité et la part du personnel en courbe.
      graphique: (c) => {
        const x = tableauDeBordDuMois(c);
        const lire = (p: Readonly<Record<string, number>>) => laboratoireDesVoyants(x, { trafic: p.trafic!, transformation: p.transformation!, panier: p.panier! });
        return {
          levier: "transformation",
          unite: "%",
          courbes: [
            { libelle: "Réalisation de l'objectif", valeur: (p) => lire(p).realisation },
            { libelle: "Indice de sécurité", valeur: (p) => lire(p).indiceDeSecurite },
            { libelle: "Part du personnel", valeur: (p) => lire(p).partDuPersonnel },
          ],
        };
      },
      defi: (c) => {
        const x = tableauDeBordDuMois(c);
        const lire = (p: Readonly<Record<string, number>>) => laboratoireDesVoyants(x, { trafic: p.trafic!, transformation: p.transformation!, panier: p.panier! });
        return {
          consigne: "Éteignez le voyant de l'objectif sans un client de plus : le trafic ne dépasse pas celui de janvier.",
          atteint: (p) => p.trafic! <= 100 && lire(p).objectifEteint,
          indice: (p) => {
            const l = lire(p);
            if (p.trafic! > 100) return `Le trafic est à ${pct(p.trafic!)} de janvier : le défi demande de ne pas ajouter de clients. Ramenez-le à 100 % au plus.`;
            return `La réalisation de l'objectif est de ${pct(l.realisation)} : il faut ${pct(x.seuilDeRealisation * 100)}. Il manque ${eur(auCentime(x.caDuVoyant - l.chiffreDAffaires))} de chiffre d'affaires, à trouver par la transformation ou le panier.`;
          },
          solution: { trafic: 100, transformation: 105, panier: 100 },
        };
      },
      explication: (c, p) => {
        const x = tableauDeBordDuMois(c);
        const l = laboratoireDesVoyants(x, { trafic: p.trafic!, transformation: p.transformation!, panier: p.panier! });
        return [
          `Le voyant de l'objectif est éteint : ${pct(l.realisation)} de réalisation, pour ${eur(l.chiffreDAffaires)} de chiffre d'affaires. Les trois leviers se multiplient : il fallait ${pct(auDixieme(x.hausseNecessaire))} de chiffre d'affaires en plus, et ${pct(auDixieme(x.hausseNecessaire))} de plus sur n'importe lequel d'entre eux les donne, ${pct(x.transformationNecessaire)} de transformation au lieu de ${pct(x.transformationN)}, ou un panier de ${eur(auCentime(x.caDuVoyant / x.m.tickets))}.`,
          `${l.traficAllume ? "Le voyant du trafic, lui, reste rouge : le tableau de bord a dit vrai, la cause n'a pas bougé." : "Le voyant du trafic s'est éteint aussi."} Sur le graphique, la réalisation monte en droite avec la transformation ; l'indice de sécurité et la part du personnel bougent en courbe, de moins en moins vite : les charges fixes ne suivent pas les ventes.`,
        ];
      },
    },
    {
      id: "la-transformation-qui-eteint",
      type: "montants",
      titre: "La transformation qui éteint le voyant",
      notions: ["conversion_rate", "dashboard"],
      question: () =>
        "Sans formule cette fois. À trafic et panier de janvier N, quel chiffre d'affaires éteint le voyant de l'objectif (au centime) ? Combien de passages en caisse faut-il pour l'atteindre (arrondi au-dessus) ? Quel taux de transformation cela fait-il (au dixième) ?",
      champs: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          { libelle: "Chiffre d'affaires du seuil du voyant", attendu: x.caDuVoyantAuCentime, tolerance: 0.01, calcul: `${eur(x.objectif)} × ${pct(x.seuilDeRealisation * 100)} = ${eur(x.caDuVoyantAuCentime)}` },
          {
            libelle: "Passages en caisse nécessaires",
            attendu: x.passagesNecessaires,
            tolerance: 1,
            calcul: `${eur(x.caDuVoyantAuCentime)} ÷ (${eur(x.ca)} ÷ ${qte(x.m.tickets)}) = ${qte(x.caDuVoyant / x.m.panierMoyen, 3)}, arrondi au-dessus : ${qte(x.passagesNecessaires)}`,
          },
          { libelle: "Taux de transformation nécessaire (%)", attendu: x.transformationNecessaire, tolerance: 0.1, calcul: `${qte(x.passagesNecessaires)} ÷ ${qte(x.m.entrees)} × 100 = ${pct(x.transformationNecessaire)}` },
        ];
      },
      explication: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          `Il faut ${qte(x.passagesNecessaires)} passages en caisse au lieu de ${qte(x.m.tickets)}, une transformation de ${pct(x.transformationNecessaire)} : ${qte(x.passagesNecessaires - x.m.tickets)} visiteurs de plus qui achètent, sur les mêmes entrées. C'est le chiffre que le laboratoire a montré. Le panier se calcule ici sans l'arrondir : à un centime près, le passage qui manque change.`,
        ];
      },
    },
    {
      id: "decomposer-l-ecart",
      type: "montants",
      titre: "Trafic, transformation, panier : l'écart décomposé",
      notions: ["dashboard", "conversion_rate", "average_basket"],
      tableau: tableauDesDeuxJanviers,
      question: (c) => {
        const x = tableauDeBordDuMois(c);
        return `Le chiffre d'affaires perd ${eur(-(x.ca - x.n1.chiffreDAffaires))} sur janvier N − 1. Décomposez cet écart en trois effets, dans cet ordre : celui du trafic (les entrées gagnées ou perdues, au chiffre d'affaires par entrée de N − 1), celui de la transformation (les passages de N face à ceux que le taux de N − 1 aurait donnés sur les entrées de N, au panier de N − 1), celui du panier (les passages de N, au panier gagné ou perdu). Négatif pour un effet défavorable.`;
      },
      champs: (c) => {
        const x = tableauDeBordDuMois(c);
        const n1 = x.n1;
        const effetAuPanierAffiche = auCentime(x.m.tickets * (x.panierN - x.panierN1));
        return [
          {
            libelle: "Effet du trafic",
            attendu: x.effetDuTrafic,
            tolerance: 0.5,
            calcul: `(${qte(x.m.entrees)} − ${qte(n1.trafic)}) × (${eur(n1.chiffreDAffaires)} ÷ ${qte(n1.trafic)}) = ${eur(x.effetDuTrafic)}`,
          },
          {
            libelle: "Effet de la transformation",
            attendu: x.effetDeLaTransformation,
            tolerance: 0.5,
            calcul: `${qte(x.m.entrees)} × ${qte(n1.tickets)} ÷ ${qte(n1.trafic)} = ${qte(x.passagesAuTauxN1)} passages au taux de N − 1 ; (${qte(x.m.tickets)} − ${qte(x.passagesAuTauxN1)}) × ${eur(x.panierN1)} = ${eur(x.effetDeLaTransformation)}`,
          },
          {
            libelle: "Effet du panier",
            attendu: x.effetDuPanier,
            // Le panier de N s'affiche au centime (87 450 € ÷ 948 = 92,247… €) : l'élève qui le multiplie par
            // les passages trouve quelques euros de plus. Sa réponse est juste aussi : la tolérance couvre l'écart.
            tolerance: auCentime(Math.max(0.5, Math.abs(effetAuPanierAffiche - x.effetDuPanier) + 0.01)),
            calcul: `${eur(x.ca)} − ${qte(x.m.tickets)} × ${eur(x.panierN1)} = ${eur(x.effetDuPanier)} ; avec le panier arrondi, ${qte(x.m.tickets)} × (${eur(x.panierN)} − ${eur(x.panierN1)}) = ${eur(effetAuPanierAffiche)}, juste aussi`,
          },
        ];
      },
      explication: (c) => {
        const x = tableauDeBordDuMois(c);
        const total = auCentime(x.effetDuTrafic + x.effetDeLaTransformation + x.effetDuPanier);
        return [
          `Les trois effets refont l'écart : ${eur(x.effetDuTrafic)} + ${eur(x.effetDeLaTransformation)} + ${eur(x.effetDuPanier)} = ${eur(total)}. Le trafic coûte ${eur(-x.effetDuTrafic)} ; la transformation et le panier en rendent ${eur(auCentime(x.effetDeLaTransformation + x.effetDuPanier))}. Le voyant du trafic était donc le bon : c'est lui qui explique.`,
          "Comme une analyse d'écarts, la décomposition dépend de l'ordre : chaque effet se valorise avec les chiffres de N − 1 pour ce qui vient après, et de N pour ce qui vient avant. L'ordre change la part de chaque effet, jamais leur total.",
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Février, à rebours",
      notions: ["dashboard", "average_basket", "conversion_rate"],
      question: (c) => {
        const x = tableauDeBordDuMois(c);
        return `De février, le manager ne connaît que trois chiffres : un taux de réalisation de l'objectif de ${pct(FEVRIER_A_REBOURS.realisation * 100)}, ${qte(FEVRIER_A_REBOURS.entrees)} entrées et un taux de transformation de ${pct(FEVRIER_A_REBOURS.transformation * 100)}. L'objectif de février est, comme en janvier, le tiers du budget du trimestre (${eur(x.objectif)}). Retrouvez le chiffre d'affaires de février (au centime), ses passages en caisse, puis son panier moyen (au centime).`;
      },
      champs: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          { libelle: "Chiffre d'affaires de février", attendu: x.caDeFevrier, tolerance: 0.01, calcul: `${eur(x.objectif)} × ${pct(FEVRIER_A_REBOURS.realisation * 100)} = ${eur(x.caDeFevrier)}` },
          { libelle: "Passages en caisse de février", attendu: x.passagesDeFevrier, calcul: `${qte(FEVRIER_A_REBOURS.entrees)} × ${pct(FEVRIER_A_REBOURS.transformation * 100)} = ${qte(x.passagesDeFevrier)}` },
          { libelle: "Panier moyen de février", attendu: x.panierDeFevrier, tolerance: 0.01, calcul: `${eur(x.caDeFevrier)} ÷ ${qte(x.passagesDeFevrier)} = ${eur(x.panierDeFevrier)}` },
        ];
      },
      explication: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          `Février réalise ${pct(FEVRIER_A_REBOURS.realisation * 100)} de l'objectif avec encore moins d'entrées qu'en janvier : son panier, ${eur(x.panierDeFevrier)}, a pris ${pct(evolution(x.panierN, x.panierDeFevrier))} sur janvier. Remonter un indicateur à rebours, c'est poser l'identité du chiffre d'affaires (trafic × transformation × panier) et la résoudre pour l'inconnue.`,
          "Un panier qui monte autant demande une explication avant d'être fêté : une remise de moins, un mix plus cher, une commande d'un comité d'entreprise ? Le tableau de bord dit où regarder, pas pourquoi.",
        ];
      },
    },
    {
      id: "critique-de-l-objectif",
      type: "choix",
      titre: "Que vaut le voyant de l'objectif ?",
      notions: ["dashboard", "seasonality"],
      question: (c) => {
        const x = tableauDeBordDuMois(c);
        return `L'objectif de janvier est le tiers du budget du trimestre : ${eur(x.objectif)}. Janvier N ne recule pourtant que de ${pct(-x.evolutionDuCa)} sur janvier N − 1. Que vaut le voyant rouge de l'objectif ?`;
      },
      options: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          {
            texte: "Il dit vrai sur l'écart, mais un tiers par mois suppose trois mois égaux : l'objectif se répartit selon la saison",
            juste: true,
            retour: `Oui. Le budget du trimestre est juste ; le découper en trois parts égales ignore que janvier, février et mars ne vendent pas autant. L'écart de ${eur(x.ecartALObjectif)} mêle ce que la boutique a mal fait et ce que le découpage lui a demandé de trop. Un objectif mensuel se cale sur le poids de chaque mois dans les années passées.`,
          },
          {
            texte: "Il ne dit rien : seul janvier N − 1 compte",
            juste: false,
            retour: "Non : la comparaison à l'an passé dit si la boutique progresse ; l'objectif dit si elle tient son budget, donc sa trésorerie et ses achats. Les deux comparaisons servent, et ne se remplacent pas.",
          },
          {
            texte: "Il dit tout : l'objectif vient du budget, et le budget fait foi",
            juste: false,
            retour: "Non : un voyant n'est jamais meilleur que son seuil. Un objectif mal réparti allume des voyants pour rien, ou en éteint qui devraient s'allumer.",
          },
          {
            texte: `Il est trop sévère : rapporté au réalisé, l'objectif fait ${pct(auDixieme((x.objectif / x.ca) * 100))}`,
            juste: false,
            retour: `Non : c'est inverser le rapport. Le taux de réalisation divise le réalisé par l'objectif : ${eur(x.ca)} ÷ ${eur(x.objectif)} = ${pct(x.realisation)}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Le tableau de bord de votre point de vente",
      notions: ["dashboard"],
      tableau: (c) => {
        const x = tableauDeBordDuMois(c);
        return {
          titre: `${x.f.entreprise} · le tableau de bord de janvier N`,
          colonnes: ["Janvier N", "Janvier N − 1", "Seuil d'alerte", "Voyant"],
          lignes: x.t.indicateurs.map((i) => ({
            libelle: INDICATEURS[i.code].libelle,
            valeurs: [INDICATEURS[i.code].ecrire(i.valeur), i.n1 === null ? "" : INDICATEURS[i.code].ecrire(i.n1), seuilEcrit(i.code, x.f), voyantAllume(x.f.seuilsDAlerte[i.code], i.valeur) ? "rouge" : "vert"],
          })),
        };
      },
      texte: (c) => {
        const x = tableauDeBordDuMois(c);
        return [
          `Le tableau de bord de ${x.f.entreprise} a deux voyants rouges en janvier : la réalisation de l'objectif, ${pct(x.realisation)}, et le trafic, ${pct(x.evolutionDuTrafic)} sur N − 1. Le second explique le premier : la transformation et le panier progressent, et l'écart sur N − 1 se décompose en ${eur(x.effetDuTrafic)} de trafic, ${eur(x.effetDeLaTransformation)} de transformation et ${eur(x.effetDuPanier)} de panier.`,
          `On peut éteindre le voyant de l'objectif sans un client de plus, avec ${pct(x.transformationNecessaire)} de transformation au lieu de ${pct(x.transformationN)} ; le voyant du trafic, lui, reste allumé, et la décision qu'il appelle aussi : faire venir.`,
          "Les limites : un voyant ne vaut que son seuil, et un objectif découpé en parts égales ignore la saison ; la décomposition de l'écart dépend de l'ordre des effets ; et un tableau de bord dit où regarder, pas pourquoi.",
          "Au niveau de l'examen, vous savez ranger les indicateurs, comparer un mois à l'an passé et à l'objectif, décomposer un écart de chiffre d'affaires en trafic, transformation et panier, retrouver un indicateur à rebours, et dire ce que vaut un objectif.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Taux de réalisation = réalisé ÷ objectif × 100. Évolution = (N ÷ N − 1 − 1) × 100. Chiffre d'affaires = entrées × taux de transformation × panier moyen ; taux de transformation = passages en caisse ÷ entrées.",
    },
  ],
};
