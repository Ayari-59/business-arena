import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { margeUnitaire } from "../monde/capacite";
import { T_DE_LA_TABLE, arrondi, lectureDeLaTable } from "../monde/loi-normale";
import { CAPACITES_DU_COURS, type FicheDeLaCapacite } from "../monde/nova-capacite";
import {
  CONFIANCE_DE_L_ESTIMATION,
  ECHANTILLON_HORAIRE,
  PESEE_EN_BOUT_DE_LIGNE,
  POIDS_DERIVE,
  POIDS_D_UNE_ENCEINTE,
  PRECISION_VOULUE,
  coutDUnDefautTout,
  defautsDePoids,
  economieDeLaPesee,
  ecartTypeDeLaMoyenne,
  intervalleDeConfiance,
  laboratoireDeLaLigne,
  paretoDesDefauts,
  releveDuJour,
  seuilDeLaPesee,
  tailleDEchantillon,
} from "../monde/qualite-de-la-ligne";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : PILOTER LA QUALITÉ (contrôle de gestion, palier 4 ; DCG UE 11, programme 2025, 4.3 « Aider
 * au pilotage de la qualité » ; BUT GEA, « en solutionnant des problèmes de gestion en avenir certain et
 * aléatoire »).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la qualité de
 * NOVA est celle de la fiche de capacité (« Produire bien », « Le coût de la non-qualité »), relue par
 * monde/qualite-de-la-ligne.ts, et la loi normale se calcule par monde/loi-normale.ts.
 *
 * L'objet : piloter la qualité de la ligne de NOVA. En amont, les outils qui ne calculent pas, ou peu :
 * le diagramme de Pareto des 910 défauts de l'année, le diagramme d'Ishikawa des causes du défaut de
 * poids. Puis la loi normale : la part des enceintes hors tolérance, bien réglée et déréglée, et ce
 * qu'elle coûte, ventes perdues comprises. Puis le choix entre tout contrôler (une pesée en bout de
 * ligne) et contrôler par échantillon : la loi de la moyenne d'un échantillon, l'estimation ponctuelle,
 * l'intervalle de confiance d'une moyenne, la taille d'échantillon. Enfin, les risques de ces outils.
 *
 * Ce que le chapitre ne fait pas, suivant le programme 2025 : les tests d'hypothèse, l'intervalle de
 * confiance d'une proportion, la loi binomiale et la loi de Poisson.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, le-pareto, les-priorites, les-cinq-m, la-loi-du-poids, la-moyenne-d-un-echantillon,
 *     l-intervalle-ecart-type-connu (la formule est au repère ou dans la question, qui nomme les
 *     chiffres) ;
 *   · autonome : le-dereglage, l-estimation-ponctuelle, l-intervalle-ecart-type-inconnu (ni formule ni
 *     chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-dereglage
 *     avant le-dereglage ; la-pesee-au-curseur (ce que la pesée évite selon les défauts de poids, face
 *     à son coût) avant la-pesee-a-rebours ; predire-l-echantillon avant la-moyenne-d-un-echantillon ;
 *   · le laboratoire : le-laboratoire-de-la-ligne (réglage, écart-type, taille de l'échantillon,
 *     confiance ; peu de défauts et une moyenne connue de près ; le graphique des parts hors tolérance
 *     selon le réglage, en U) ;
 *   · expert : la-pesee-a-rebours, lire-l-intervalle, la-taille-de-l-echantillon, les-limites ; puis la
 *     synthèse.
 */

/** Les entreprises du chapitre : NOVA, la seule fiche de capacité du monde du cours. */
export const ENTREPRISES_DE_LA_QUALITE_PILOTEE: readonly string[] = ["nova"];

/**
 * LES CAUSES DU DÉFAUT DE POIDS, SELON LE CERCLE DE QUALITÉ (hypothèse du cours) : 5 causes, une par
 * famille des 5 M d'Ishikawa, et la part des défauts de poids que le cercle attribue à chacune.
 */
export const CAUSES_DU_POIDS = [
  { libelle: "La buse de colle s'encrasse en fin de poste", famille: "materiel", part: 0.35, pourquoi: "Le matériel : la machine elle-même, ici la buse qui dose la colle." },
  { libelle: "Un lot d'aimants plus légers que la commande", famille: "matiere", part: 0.2, pourquoi: "La matière : ce qui entre dans l'enceinte, les composants achetés." },
  { libelle: "Le réglage de la buse n'est écrit nulle part", famille: "methode", part: 0.2, pourquoi: "La méthode : la façon de faire, ses consignes et ses procédures." },
  { libelle: "Un opérateur nouveau dose la colle à l'œil", famille: "main-d-oeuvre", part: 0.15, pourquoi: "La main-d'œuvre : la formation et l'expérience de qui travaille." },
  { libelle: "L'atelier chauffe l'après-midi, la colle coule plus", famille: "milieu", part: 0.1, pourquoi: "Le milieu : l'environnement de travail, la température, la poussière." },
] as const;

/** Les bornes du curseur des défauts de poids de l'année. */
export const DEFAUTS_DU_CURSEUR = { min: 0, max: 1_000 } as const;

/** Les leviers du laboratoire : leurs bornes et leur pas ; la confiance se choisit. */
export const LEVIERS_DE_LA_LIGNE = {
  reglage: { min: 840, max: 860, pas: 0.5 },
  ecartType: { min: 4, max: 16, pas: 0.5 },
  taille: { min: 10, max: 200, pas: 10 },
  confiances: [90, 95, 99],
} as const;

/** Le défi du laboratoire : au plus 100 défauts de poids par an, et une moyenne estimée à 1,5 g près. */
export const DEFI_DE_LA_LIGNE = { defautsAuPlus: 100, precisionAuPlus: 1.5 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pr = (p: number) => (p + 0).toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const tt = (t: number) => (t + 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).replace(/^-/, "−");
const g = (x: number, d = 2) => `${qte(x, d)} g`;
const pct = (p: number, d = 2) => `${qte(p * 100, d)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const TOLERANCE_D_UNE_PROBABILITE = 0.002;

/** La fiche de capacité de l'entreprise du cas. */
export function ficheDe(c: Pick<Cas, "code">): FicheDeLaCapacite {
  const f = CAPACITES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de fiche de capacité pour ${c.code}`);
  return f;
}

/** Le défi du laboratoire, pour une position. */
export function defiDeLaLigne(f: FicheDeLaCapacite, p: Readonly<Record<string, number>>) {
  const l = laboratoireDeLaLigne(f, p);
  return l.nombre <= DEFI_DE_LA_LIGNE.defautsAuPlus + 1e-9 && l.demi <= DEFI_DE_LA_LIGNE.precisionAuPlus + 1e-9;
}

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois par entreprise (la fiche est figée). */
export function qualiteDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre(c);
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const q = f.qualite;
  const P = POIDS_D_UNE_ENCEINTE;
  const T = T_DE_LA_TABLE;
  const volume = defautsDePoids(f).volume;
  const coutTout = coutDUnDefautTout(f);
  const pareto = paretoDesDefauts(f);
  const poidsReleves = pareto.causes.find((x) => x.code === "poids")!.nombre;
  // La ligne bien réglée, à la table : t = ±2,5.
  const bas = P.cible - P.tolerance;
  const haut = P.cible + P.tolerance;
  const lu = (m: number) => {
    const sous = lectureDeLaTable((bas - m) / P.ecartType);
    const dessus = arrondi(1 - lectureDeLaTable((haut - m) / P.ecartType), 4);
    const hors = arrondi(sous + dessus, 4);
    const nombre = auCentime(volume * hors);
    return { sous, dessus, hors, nombre, cout: auCentime(nombre * coutTout) };
  };
  const regle = lu(P.cible);
  const derive = lu(POIDS_DERIVE);
  const surcout = auCentime(derive.cout - regle.cout);
  // La pesée en bout de ligne.
  const economie = economieDeLaPesee(f);
  const seuilPesee = seuilDeLaPesee(f);
  const gainDeLaPesee = auCentime(derive.nombre * economie - PESEE_EN_BOUT_DE_LIGNE);
  // L'échantillon horaire : la loi de la moyenne de 25 enceintes.
  const sigmaMoyenne = ecartTypeDeLaMoyenne(P.ecartType, ECHANTILLON_HORAIRE);
  const fourchette = intervalleDeConfiance(P.cible, P.ecartType, ECHANTILLON_HORAIRE, T.centreA95);
  const tAlerte = arrondi((POIDS_DERIVE - fourchette.haut) / sigmaMoyenne, 2);
  const alerte = lectureDeLaTable(tAlerte);
  // Le relevé du jour : l'estimation ponctuelle et les intervalles de confiance.
  const r = releveDuJour();
  const icConnu = intervalleDeConfiance(r.moyenne, P.ecartType, r.n, T.centreA95);
  const icInconnu = intervalleDeConfiance(r.moyenne, r.estimationDeLEcartType, r.n, T.centreA95);
  // La taille d'échantillon pour connaître la moyenne à 1 g près.
  const taille95 = tailleDEchantillon(P.ecartType, PRECISION_VOULUE, T.centreA95);
  const taille99 = tailleDEchantillon(P.ecartType, PRECISION_VOULUE, T.centreA99);
  // Le laboratoire.
  const depart = { reglage: POIDS_DERIVE, ecartType: P.ecartType, taille: r.n, confiance: Math.round(CONFIANCE_DE_L_ESTIMATION * 100) };
  const solution = { reglage: P.cible, ecartType: 8, taille: 110, confiance: Math.round(CONFIANCE_DE_L_ESTIMATION * 100) };
  return {
    f,
    q,
    P,
    T,
    m: margeUnitaire(f),
    volume,
    coutTout,
    pareto,
    poidsReleves,
    bas,
    haut,
    regle,
    derive,
    surcout,
    economie,
    seuilPesee,
    gainDeLaPesee,
    sigmaMoyenne,
    fourchette,
    tAlerte,
    alerte,
    r,
    icConnu,
    icInconnu,
    taille95,
    taille99,
    depart,
    solution,
  };
}

export type QualiteDuChapitre = ReturnType<typeof qualiteDuChapitre>;

/** La qualité de NOVA, l'année N + 1 : le document du chapitre. */
export function tableauDeLaLigne(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = qualiteDuChapitre(c);
  return {
    titre: `La qualité de la ligne de ${x.f.entreprise}, l'année N + 1`,
    colonnes: ["Donnée"],
    lignes: [
      { libelle: "Enceintes fabriquées dans l'année", valeurs: [qte(x.volume)] },
      { libelle: "Défauts de l'année, au budget de prévention actuel", valeurs: [`${qte(x.pareto.total)}, soit ${pct(x.pareto.total / x.volume, 1)}`] },
      { libelle: "Part des défauts que trouve le contrôle final", valeurs: [pct(x.q.controleFinal.tauxDeDetection, 0)] },
      { libelle: "Un défaut trouvé : la retouche", valeurs: [eur(x.q.coutDUnDefautDetecte)] },
      { libelle: "Un défaut livré : le retour sous garantie", valeurs: [`${eur(x.q.coutDUnDefautLivre)}, et ${qte(x.q.ventesPerduesParDefautLivre)} ventes perdues à ${eur(x.m)} de marge`] },
      { libelle: "Ce que coûte un défaut, ventes perdues comprises", valeurs: [eur(x.coutTout)] },
      { libelle: "Poids d'une enceinte au cahier des charges", valeurs: [`${g(x.P.cible, 0)}, à ${g(x.P.tolerance, 0)} près`] },
      { libelle: "Poids d'une enceinte, ligne bien réglée", valeurs: [`loi normale N(${qte(x.P.cible)} ; ${qte(x.P.ecartType)})`] },
    ],
  };
}

/** Le diagramme de Pareto à compléter : les défauts classés, leur part et la part cumulée. */
export function grilleDuPareto(c: Pick<Cas, "code">): TableauACompleter {
  const x = qualiteDuChapitre(c);
  const causes = x.pareto.causes;
  return {
    titre: `Les ${qte(x.pareto.total)} défauts de l'année, classés du plus fréquent au moins fréquent`,
    colonnes: ["Défauts relevés", "Part des défauts, en %", "Part cumulée, en %"],
    tolerance: 0.1,
    lignes: [
      ...causes.map((k, i) => ({
        libelle: k.libelle,
        cellules: [
          { valeur: k.nombre, unite: "défauts" },
          { valeur: arrondi(k.part * 100, 2), saisir: true, unite: "%", calcul: `${qte(k.nombre)} ÷ ${qte(x.pareto.total)} = ${pct(k.part)}`, indice: "les défauts de la cause, rapportés à tous les défauts" },
          {
            valeur: arrondi(k.cumul * 100, 2),
            saisir: true,
            unite: "%",
            horsTotal: true,
            calcul: i === 0 ? `la première cause : ${pct(k.cumul)}` : `${pct(causes[i - 1]!.cumul)} + ${pct(k.part)} = ${pct(k.cumul)}`,
            indice: "la part de cette cause, plus celles des causes classées avant elle",
          },
        ],
      })),
      { libelle: "Total", fort: true, totalDe: { plus: causes.map((_, i) => i) }, cellules: [{ valeur: x.pareto.total, unite: "défauts" }, { valeur: null }, { valeur: null }] },
    ],
  };
}

export const PILOTER_LA_QUALITE: Chapitre = {
  code: "piloter-la-qualite",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "Piloter la qualité",
  accroche:
    "Les 910 défauts de la ligne de NOVA : lesquels traiter d'abord, combien d'enceintes sortent hors du poids, faut-il tout peser ou peser un échantillon, et que dit un échantillon de la production entière ?",
  objectifs: [
    "Hiérarchiser les causes de non-qualité par un diagramme de Pareto, et les ranger selon les 5 M d'Ishikawa",
    "Calculer avec la loi normale la part d'une production hors tolérance, et ce qu'elle coûte",
    "Décrire la loi de la moyenne d'un échantillon, et estimer la moyenne d'une production par un intervalle de confiance",
    "Choisir entre tout contrôler et contrôler par échantillon, et dimensionner un échantillon",
    "Juger les risques et les limites des outils de gestion de la qualité",
  ],
  libre: false,
  prerequis: ["le-seuil-en-avenir-aleatoire", "le-cout-de-la-non-qualite"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_QUALITE_PILOTEE,
    pourquoi: "ce chapitre suit la ligne de montage de NOVA dans la simulation du cours, ses défauts, leurs coûts et le poids de ses enceintes ; la méthode vaut pour toute production.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Piloter la qualité, en amont et en aval",
      notions: ["productivity"],
      tableau: tableauDeLaLigne,
      texte: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, sur la ligne de montage de ${x.f.entreprise}, l'année N + 1, au budget de prévention actuel : ${qte(x.volume)} enceintes, ${qte(x.pareto.total)} défauts. Les chapitres « Produire bien » et « Le coût de la non-qualité » en ont chiffré le coût ; celui-ci apprend à piloter la qualité.`,
          `Un défaut trouvé au contrôle coûte une retouche ; un défaut livré revient sous garantie et fait perdre des ventes. En moyenne, ventes perdues comprises, un défaut coûte ${eur(x.coutTout)} : la qualité est l'aptitude du produit à satisfaire ce que le client attend, et son absence se paie.`,
          "Les outils de la qualité sont de deux sortes. En amont, ils cherchent les causes pour améliorer le processus, sans beaucoup de calcul : le diagramme de Pareto, le diagramme d'Ishikawa, les cercles de qualité. En aval, ils vérifient la production par la statistique : la loi normale, l'échantillonnage, l'estimation.",
        ];
      },
      repere: () =>
        "La qualité se pilote en amont (chercher les causes, améliorer en continu) et en aval (vérifier la production). Un défaut coûte deux fois : ce qu'il faut pour le réparer, et ce qu'il fait perdre de clients.",
    },
    {
      id: "le-pareto",
      objectifs: [0],
      type: "a-completer",
      titre: "Le diagramme de Pareto",
      question: () =>
        "Le service qualité a relevé la cause de chaque défaut de l'année. Calculez la part de chaque cause dans le total des défauts, puis la part cumulée, du plus fréquent au moins fréquent.",
      grille: grilleDuPareto,
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        const [a, b] = x.pareto.causes;
        return [
          `Les 2 premières causes, sur ${qte(x.pareto.causes.length)}, font ${pct(b!.cumul, 1)} des défauts : c'est la loi des 20/80, un petit nombre de causes pour l'essentiel des effets. Le diagramme les montre en barres décroissantes, sous la courbe des parts cumulées.`,
          `Le poids hors tolérance vient en tête, ${qte(a!.nombre)} défauts. Il fera l'objet de la suite du chapitre.`,
        ];
      },
    },
    {
      id: "les-priorites",
      objectifs: [0],
      type: "choix",
      titre: "Par où commencer",
      question: () => "Le budget de la qualité ne permet qu'un chantier cette année. Que conclut le contrôleur du diagramme de Pareto ?",
      options: (c) => {
        const x = qualiteDuChapitre(c);
        const [a, b] = x.pareto.causes;
        const derniere = x.pareto.causes.at(-1)!;
        return [
          {
            texte: `Traiter d'abord le poids : ${pct(a!.part, 1)} des défauts`,
            juste: true,
            retour: `Oui. Avec la soudure, ${pct(b!.cumul, 1)} des défauts ; un chantier sur le poids en évite au plus ${qte(a!.nombre)}, ${eur(auCentime(a!.nombre * x.coutTout))} par an. Encore faut-il en connaître les causes : c'est le rôle du diagramme d'Ishikawa.`,
          },
          {
            texte: "Traiter un peu chaque cause, pour ne rien laisser de côté",
            juste: false,
            retour: "Non : disperser l'effort sur toutes les causes en traite mal chacune. Pareto sert justement à choisir où porter l'effort.",
          },
          {
            texte: `Traiter « ${derniere.libelle} » : la cause la moins connue, donc la plus inquiétante`,
            juste: false,
            retour: `Non : elle pèse ${pct(derniere.part, 1)} des défauts. Ce qui inquiète n'est pas ce qui coûte.`,
          },
        ];
      },
    },
    {
      id: "les-cinq-m",
      objectifs: [0],
      type: "tri",
      titre: "Le diagramme d'Ishikawa",
      question: () =>
        "Un cercle de qualité réunit les opérateurs, le régleur et l'acheteur. Il a cherché pourquoi les enceintes sortent hors du poids, et chiffré ce que coûte chaque cause par an. Rangez chacune dans sa famille des 5 M.",
      relance: "Demandez-vous où la cause se trouve : dans la machine, dans les composants, dans la façon de faire, chez qui travaille, ou autour de l'atelier.",
      categories: [
        { code: "materiel", libelle: "Matériel" },
        { code: "matiere", libelle: "Matière" },
        { code: "methode", libelle: "Méthode" },
        { code: "main-d-oeuvre", libelle: "Main-d'œuvre" },
        { code: "milieu", libelle: "Milieu" },
      ],
      elements: (c) => {
        const x = qualiteDuChapitre(c);
        return CAUSES_DU_POIDS.map((k) => ({ libelle: k.libelle, montant: auCentime(k.part * x.poidsReleves * x.coutTout), categorie: k.famille, pourquoi: k.pourquoi }));
      },
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `Le diagramme d'Ishikawa range les causes d'un effet, ici ${qte(x.poidsReleves)} enceintes hors du poids, en arêtes de poisson : une arête par famille. Il ne calcule rien ; il sert à animer le cercle et à ne rien oublier, en demandant « pourquoi ? » jusqu'à la cause profonde.`,
          "La buse encrassée et le réglage non écrit se traitent ensemble : un nettoyage à chaque fin de poste, et une consigne écrite. Les causes s'enchaînent souvent d'une famille à l'autre.",
        ];
      },
    },
    {
      id: "la-loi-du-poids",
      objectifs: [1],
      type: "montants",
      titre: "Les enceintes hors du poids",
      question: (c) => {
        const x = qualiteDuChapitre(c);
        return `Ligne bien réglée, le poids X d'une enceinte suit N(${qte(x.P.cible)} ; ${qte(x.P.ecartType)}). Une enceinte est hors tolérance sous ${g(x.bas, 0)} ou au-dessus de ${g(x.haut, 0)}. Calculez P(X < ${qte(x.bas)}) = Π((${qte(x.bas)} − ${qte(x.P.cible)}) ÷ ${qte(x.P.ecartType)}), la part hors tolérance (les deux côtés), le nombre d'enceintes hors tolérance sur ${qte(x.volume)}, et leur coût par an à ${eur(x.coutTout)} le défaut.`;
      },
      champs: (c) => {
        const x = qualiteDuChapitre(c);
        const t = (x.bas - x.P.cible) / x.P.ecartType;
        return [
          { libelle: `P(X < ${qte(x.bas)})`, attendu: x.regle.sous, tolerance: TOLERANCE_D_UNE_PROBABILITE, calcul: `Π(${tt(t)}) = 1 − Π(${tt(-t)}) = 1 − ${pr(lectureDeLaTable(-t))} = ${pr(x.regle.sous)}` },
          { libelle: "Part hors tolérance", attendu: x.regle.hors, tolerance: TOLERANCE_D_UNE_PROBABILITE, calcul: `la loi est symétrique autour de ${qte(x.P.cible)} : ${pr(x.regle.sous)} + ${pr(x.regle.dessus)} = ${pr(x.regle.hors)}` },
          { libelle: "Enceintes hors tolérance dans l'année", attendu: x.regle.nombre, tolerance: 1.5, calcul: `${qte(x.volume)} × ${pr(x.regle.hors)} = ${qte(x.regle.nombre)}` },
          { libelle: "Coût de ces défauts dans l'année", attendu: x.regle.cout, tolerance: 80, calcul: `${qte(x.regle.nombre)} × ${eur(x.coutTout)} = ${eur(x.regle.cout)}` },
        ];
      },
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `La loi prévoit ${qte(x.regle.nombre)} enceintes hors du poids ; le relevé du Pareto en compte ${qte(x.poidsReleves)}. Une ligne bien réglée en produit donc toujours : la tolérance est à ${tt(x.P.tolerance / x.P.ecartType)} écarts-types de la cible, et la loi normale n'a pas de borne.`,
        ];
      },
    },
    {
      id: "predire-le-dereglage",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le dérèglement",
      question: (c) => {
        const x = qualiteDuChapitre(c);
        return `Avant de calculer, pariez. La buse de colle s'encrasse : le poids moyen monte de ${g(x.P.cible, 0)} à ${g(POIDS_DERIVE, 0)}, l'écart-type ne change pas, et la tolérance reste de ${g(x.bas, 0)} à ${g(x.haut, 0)}. La part des enceintes hors tolérance…`;
      },
      options: (c) => {
        const x = qualiteDuChapitre(c);
        const k = x.derive.hors / x.regle.hors;
        const voir = "L'étape suivante la calcule.";
        return [
          { texte: "Double à peu près", juste: k >= 1.6 && k < 2.6, retour: `Bon pari. ${voir}` },
          { texte: "Ne change pas : la tolérance garde sa largeur", juste: k < 1.1, retour: `Pari à vérifier. ${voir}` },
          { texte: "Monte d'un dixième environ, comme le décalage", juste: k >= 1.1 && k < 1.6, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-dereglage",
      objectifs: [1],
      type: "montants",
      titre: "La ligne déréglée",
      question: (c) => {
        const x = qualiteDuChapitre(c);
        return `À vous, sans formule : le poids suit maintenant N(${qte(POIDS_DERIVE)} ; ${qte(x.P.ecartType)}). Calculez la part des enceintes au-dessus de ${g(x.haut, 0)}, celle sous ${g(x.bas, 0)}, le nombre d'enceintes hors tolérance dans l'année, puis ce que le dérèglement coûte de plus par an.`;
      },
      champs: (c) => {
        const x = qualiteDuChapitre(c);
        const d = x.derive;
        const tH = (x.haut - POIDS_DERIVE) / x.P.ecartType;
        const tB = (x.bas - POIDS_DERIVE) / x.P.ecartType;
        return [
          { libelle: `P(X > ${qte(x.haut)})`, attendu: d.dessus, tolerance: TOLERANCE_D_UNE_PROBABILITE, calcul: `1 − Π((${qte(x.haut)} − ${qte(POIDS_DERIVE)}) ÷ ${qte(x.P.ecartType)}) = 1 − Π(${tt(tH)}) = ${pr(d.dessus)}` },
          { libelle: `P(X < ${qte(x.bas)})`, attendu: d.sous, tolerance: TOLERANCE_D_UNE_PROBABILITE, calcul: `Π(${tt(tB)}) = 1 − Π(${tt(-tB)}) = ${pr(d.sous)}` },
          { libelle: "Enceintes hors tolérance dans l'année", attendu: d.nombre, tolerance: 4, calcul: `${qte(x.volume)} × (${pr(d.dessus)} + ${pr(d.sous)}) = ${qte(d.nombre)}` },
          { libelle: "Coût du dérèglement en plus, par an", attendu: x.surcout, tolerance: 150, calcul: `(${qte(d.nombre)} − ${qte(x.regle.nombre)}) × ${eur(x.coutTout)} = ${eur(x.surcout)}` },
        ];
      },
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `Un décalage de ${g(POIDS_DERIVE - x.P.cible, 0)}, invisible à l'œil, coûte ${eur(x.surcout)} par an. Le côté haut se rapproche de la moyenne et gagne beaucoup ; le côté bas s'en éloigne et ne perd presque rien. Centrer la machine est la première économie de la qualité.`,
        ];
      },
    },
    {
      id: "la-pesee-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "Tout peser, à partir de quand",
      question: (c) => {
        const x = qualiteDuChapitre(c);
        return `Un fournisseur propose une balance en bout de ligne : ${eur(PESEE_EN_BOUT_DE_LIGNE)} par an. Elle écarte toute enceinte hors du poids avant l'emballage : chaque défaut de poids se retouche, ${eur(x.q.coutDUnDefautDetecte)}, au lieu de coûter ${eur(x.coutTout)} en moyenne. Faites varier les défauts de poids de l'année : une droite donne ce que la balance évite, l'autre son coût. Placez le curseur sur le plus petit nombre de défauts qui la paie, puis validez.`;
      },
      grandeur: () => ({ libelle: "Défauts de poids dans l'année", unite: "enceintes" }),
      cible: (c) => ({ attendu: qualiteDuChapitre(c).seuilPesee, min: DEFAUTS_DU_CURSEUR.min, max: DEFAUTS_DU_CURSEUR.max }),
      zones: ["La balance paie", "La balance coûte plus qu'elle n'évite"],
      rates: () => ({
        dessous: "À ce nombre de défauts, la balance coûte encore plus qu'elle n'évite.",
        dessus: "Avec moins de défauts, la balance paie déjà : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le seuil",
      lecture: (c, d) => {
        const x = qualiteDuChapitre(c);
        return [
          { libelle: "Coût de ces défauts sans la balance", montant: auCentime(d * x.coutTout) },
          { libelle: "Coût de ces défauts avec la balance", montant: auCentime(d * x.q.coutDUnDefautDetecte) },
          { libelle: "Ce que la balance évite", montant: auCentime(d * x.economie) },
          { libelle: "Gain de la balance, son coût payé", montant: auCentime(d * x.economie - PESEE_EN_BOUT_DE_LIGNE), fort: true },
        ];
      },
      droites: (c) => {
        const x = qualiteDuChapitre(c);
        return { produit: (d) => d * x.economie, cout: () => PESEE_EN_BOUT_DE_LIGNE, libelles: ["Ce que la balance évite", "Le coût de la balance"] };
      },
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `La balance paie à partir de ${qte(x.seuilPesee)} défauts de poids par an : chacun lui fait éviter ${eur(x.economie)}. Ligne bien réglée, ${qte(x.regle.nombre)} défauts : elle coûterait plus qu'elle n'évite. Ligne déréglée, ${qte(x.derive.nombre)} : elle paierait.`,
          "C'est un seuil de rentabilité, appliqué au contrôle : un contrôle exhaustif ne se justifie que si les défauts sont nombreux ou graves.",
        ];
      },
    },
    {
      id: "la-pesee-a-rebours",
      objectifs: [3],
      type: "montants",
      titre: "Peser tout, ou régler la machine",
      question: () => {
        return `Sans formule : calculez ce que la balance évite par défaut de poids, le nombre de défauts à partir duquel elle paie, puis son gain net par an si la ligne reste déréglée à ${g(POIDS_DERIVE, 0)}.`;
      },
      champs: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          { libelle: "Ce que la balance évite par défaut de poids", attendu: x.economie, calcul: `${eur(x.coutTout)} − ${eur(x.q.coutDUnDefautDetecte)} de retouche = ${eur(x.economie)}` },
          { libelle: "Défauts de poids à partir desquels elle paie", attendu: x.seuilPesee, calcul: `${eur(PESEE_EN_BOUT_DE_LIGNE)} ÷ ${eur(x.economie)} = ${qte(PESEE_EN_BOUT_DE_LIGNE / x.economie)}, soit ${qte(x.seuilPesee)} à l'unité supérieure` },
          { libelle: "Gain net de la balance, ligne déréglée", attendu: x.gainDeLaPesee, tolerance: 120, calcul: `${qte(x.derive.nombre)} × ${eur(x.economie)} − ${eur(PESEE_EN_BOUT_DE_LIGNE)} = ${eur(x.gainDeLaPesee)}` },
        ];
      },
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `La balance gagnerait ${eur(x.gainDeLaPesee)} sur une ligne déréglée ; mais régler la machine en évite ${eur(x.surcout)}, presque pour rien. Peser tout soigne l'effet ; surveiller le réglage traite la cause. Il reste à voir le dérèglement à temps, sans tout peser : c'est l'échantillonnage.`,
        ];
      },
    },
    {
      id: "predire-l-echantillon",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur l'échantillon",
      question: (c) => {
        const x = qualiteDuChapitre(c);
        return `Avant de calculer, pariez. Chaque heure, le contrôleur pèse ${qte(ECHANTILLON_HORAIRE)} enceintes prises au hasard et calcule leur poids moyen. Le poids d'une enceinte a un écart-type de ${g(x.P.ecartType, 0)}. D'une heure à l'autre, le poids moyen de l'échantillon varie…`;
      },
      options: (c) => {
        const x = qualiteDuChapitre(c);
        const k = x.P.ecartType / x.sigmaMoyenne;
        const voir = "L'étape suivante le calcule.";
        return [
          { texte: `${qte(k, 0)} fois moins qu'une enceinte`, juste: Math.abs(k - Math.sqrt(ECHANTILLON_HORAIRE)) < 1e-9, retour: `Bon pari. ${voir}` },
          { texte: `${qte(ECHANTILLON_HORAIRE)} fois moins qu'une enceinte, une par enceinte pesée`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Autant qu'une enceinte : ce sont les mêmes enceintes", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-moyenne-d-un-echantillon",
      objectifs: [2],
      type: "montants",
      titre: "La loi de la moyenne d'un échantillon",
      question: (c) => {
        const x = qualiteDuChapitre(c);
        return `Si le poids X suit N(m ; σ), la moyenne X̄ d'un échantillon de n enceintes suit N(m ; σ ÷ √n). Ligne bien réglée, m = ${qte(x.P.cible)}, σ = ${qte(x.P.ecartType)}, n = ${qte(ECHANTILLON_HORAIRE)}. Calculez l'écart-type de X̄, les bornes de l'intervalle centré sur ${qte(x.P.cible)} où tombe X̄ 95 fois sur 100 (t = ${tt(x.T.centreA95)}), puis la probabilité que X̄ dépasse sa borne haute si la ligne dérive à ${g(POIDS_DERIVE, 0)}.`;
      },
      champs: (c) => {
        const x = qualiteDuChapitre(c);
        const f = x.fourchette;
        return [
          { libelle: "Écart-type de la moyenne de l'échantillon", attendu: x.sigmaMoyenne, calcul: `${qte(x.P.ecartType)} ÷ √${qte(ECHANTILLON_HORAIRE)} = ${g(x.sigmaMoyenne)}` },
          { libelle: "Borne basse, en grammes", attendu: auCentime(f.bas), tolerance: 0.02, calcul: `${qte(x.P.cible)} − ${tt(x.T.centreA95)} × ${qte(x.sigmaMoyenne)} = ${g(f.bas)}` },
          { libelle: "Borne haute, en grammes", attendu: auCentime(f.haut), tolerance: 0.02, calcul: `${qte(x.P.cible)} + ${tt(x.T.centreA95)} × ${qte(x.sigmaMoyenne)} = ${g(f.haut)}` },
          {
            libelle: "Probabilité de dépasser la borne haute, ligne déréglée",
            attendu: x.alerte,
            tolerance: TOLERANCE_D_UNE_PROBABILITE,
            calcul: `X̄ suit N(${qte(POIDS_DERIVE)} ; ${qte(x.sigmaMoyenne)}) : 1 − Π((${qte(auCentime(f.haut))} − ${qte(POIDS_DERIVE)}) ÷ ${qte(x.sigmaMoyenne)}) = Π(${tt(x.tAlerte)}) = ${pr(x.alerte)}`,
          },
        ];
      },
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `Une moyenne varie √n fois moins qu'une enceinte : les écarts se compensent. Une moyenne au-dessus de ${g(auCentime(x.fourchette.haut))} n'arrive que ${qte(((1 - CONFIANCE_DE_L_ESTIMATION) / 2) * 100, 1)} fois sur 100 à une ligne bien réglée ; elle arrive ${pct(x.alerte, 1)} des fois à une ligne déréglée.`,
          `Peser ${qte(ECHANTILLON_HORAIRE)} enceintes par heure suffit donc à voir le dérèglement en quelques heures, sans tout peser. Même loi, deux usages : prévoir l'échantillon quand on connaît la production, et, à l'inverse, estimer la production à partir de l'échantillon.`,
        ];
      },
    },
    {
      id: "l-estimation-ponctuelle",
      objectifs: [2],
      type: "montants",
      titre: "Le relevé du jour : l'estimation ponctuelle",
      tableau: (c) => {
        const x = qualiteDuChapitre(c);
        return {
          titre: `Le poids de ${qte(x.r.n)} enceintes prises au hasard dans la production du jour`,
          colonnes: ["Enceintes"],
          lignes: x.r.classes.map((k) => ({ libelle: `De ${qte(k.de)} g à moins de ${qte(k.a)} g`, valeurs: [qte(k.effectif)] })),
        };
      },
      question: () =>
        "Sans formule : à partir du relevé (prenez le centre de chaque classe), calculez le poids moyen de l'échantillon, son écart-type, puis l'estimation de l'écart-type de toute la production.",
      champs: (c) => {
        const x = qualiteDuChapitre(c);
        const r = x.r;
        return [
          { libelle: "Poids moyen de l'échantillon, en grammes", attendu: arrondi(r.moyenne, 2), tolerance: 0.05, calcul: `Σ (effectif × centre) ÷ ${qte(r.n)} = ${g(r.moyenne)}` },
          { libelle: "Écart-type de l'échantillon, en grammes", attendu: arrondi(r.ecartTypeObserve, 2), tolerance: 0.05, calcul: `√(Σ effectif × (centre − ${qte(r.moyenne)})² ÷ ${qte(r.n)}) = ${g(r.ecartTypeObserve)}` },
          {
            libelle: "Estimation de l'écart-type de la production, en grammes",
            attendu: arrondi(r.estimationDeLEcartType, 2),
            tolerance: 0.05,
            calcul: `s = ${qte(r.ecartTypeObserve)} × √(${qte(r.n)} ÷ ${qte(r.n - 1)}) = ${g(r.estimationDeLEcartType)}`,
          },
        ];
      },
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `${g(x.r.moyenne)} est une estimation ponctuelle du poids moyen de la production : un seul nombre, qui changerait avec un autre échantillon. L'écart-type de l'échantillon sous-estime celui de la production, parce qu'il mesure les écarts à la moyenne de l'échantillon : on le corrige par √(n ÷ (n − 1)). La calculatrice donne s directement.`,
        ];
      },
    },
    {
      id: "l-intervalle-ecart-type-connu",
      objectifs: [2],
      type: "montants",
      titre: "L'intervalle de confiance, écart-type connu",
      question: (c) => {
        const x = qualiteDuChapitre(c);
        return `Un poids moyen à ${g(x.r.moyenne)} ne dit pas où est vraiment celui de la production. Supposez l'écart-type de la production connu, ${g(x.P.ecartType, 0)}. L'intervalle de confiance à 95 % de la moyenne m est x̄ ± ${tt(x.T.centreA95)} × σ ÷ √n. Calculez sa demi-largeur, puis ses deux bornes.`;
      },
      champs: (c) => {
        const x = qualiteDuChapitre(c);
        const i = x.icConnu;
        return [
          { libelle: "Demi-largeur, en grammes", attendu: arrondi(i.demi, 2), tolerance: 0.02, calcul: `${tt(x.T.centreA95)} × ${qte(x.P.ecartType)} ÷ √${qte(x.r.n)} = ${g(i.demi)}` },
          { libelle: "Borne basse, en grammes", attendu: arrondi(i.bas, 2), tolerance: 0.03, calcul: `${qte(x.r.moyenne)} − ${qte(arrondi(i.demi, 2))} = ${g(i.bas)}` },
          { libelle: "Borne haute, en grammes", attendu: arrondi(i.haut, 2), tolerance: 0.03, calcul: `${qte(x.r.moyenne)} + ${qte(arrondi(i.demi, 2))} = ${g(i.haut)}` },
        ];
      },
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `Avec 95 chances sur 100, le poids moyen de la production est entre ${g(x.icConnu.bas)} et ${g(x.icConnu.haut)}. ${g(x.P.cible, 0)}, la cible, n'y est pas.`,
        ];
      },
    },
    {
      id: "l-intervalle-ecart-type-inconnu",
      objectifs: [2],
      type: "montants",
      titre: "L'intervalle de confiance, écart-type inconnu",
      question: (c) => {
        const x = qualiteDuChapitre(c);
        return `En vrai, l'écart-type de la production d'aujourd'hui n'est pas connu : la machine a pu changer. L'échantillon compte ${qte(x.r.n)} enceintes, assez pour remplacer σ par son estimation s. Sans formule : calculez la demi-largeur et les bornes de l'intervalle de confiance à 95 % de la moyenne.`;
      },
      champs: (c) => {
        const x = qualiteDuChapitre(c);
        const i = x.icInconnu;
        return [
          { libelle: "Demi-largeur, en grammes", attendu: arrondi(i.demi, 2), tolerance: 0.03, calcul: `${tt(x.T.centreA95)} × ${qte(x.r.estimationDeLEcartType)} ÷ √${qte(x.r.n)} = ${g(i.demi)}` },
          { libelle: "Borne basse, en grammes", attendu: arrondi(i.bas, 2), tolerance: 0.05, calcul: `${qte(x.r.moyenne)} − ${qte(arrondi(i.demi, 2))} = ${g(i.bas)}` },
          { libelle: "Borne haute, en grammes", attendu: arrondi(i.haut, 2), tolerance: 0.05, calcul: `${qte(x.r.moyenne)} + ${qte(arrondi(i.demi, 2))} = ${g(i.haut)}` },
        ];
      },
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `L'intervalle est presque le même : ${g(x.icInconnu.bas)} à ${g(x.icInconnu.haut)}. Avec moins de 30 enceintes, remplacer σ par s ne suffirait plus : la moyenne ne suivrait plus une loi normale, mais une loi de Student, hors du programme.`,
        ];
      },
    },
    {
      id: "lire-l-intervalle",
      objectifs: [2],
      type: "choix",
      titre: "Ce que dit l'intervalle",
      question: (c) => {
        const x = qualiteDuChapitre(c);
        return `L'intervalle de confiance à 95 % va de ${g(x.icInconnu.bas)} à ${g(x.icInconnu.haut)}. Que peut en dire le contrôleur ?`;
      },
      options: (c) => {
        const x = qualiteDuChapitre(c);
        const dedans = x.icInconnu.bas <= x.P.cible && x.P.cible <= x.icInconnu.haut;
        return [
          {
            texte: `La moyenne a quitté ${g(x.P.cible, 0)} : la buse est à revoir`,
            juste: !dedans,
            retour: `Oui. La cible est hors de l'intervalle : avec 95 chances sur 100, la production pèse en moyenne plus de ${g(x.icInconnu.bas)}. Le réglage a dérivé, il faut nettoyer la buse avant que les défauts ne s'accumulent.`,
          },
          {
            texte: `95 % des enceintes du jour pèsent entre ${g(x.icInconnu.bas)} et ${g(x.icInconnu.haut)}`,
            juste: false,
            retour: `Non : l'intervalle encadre la moyenne de la production, pas le poids de chaque enceinte. Les enceintes, elles, se dispersent bien plus, à ${g(x.r.estimationDeLEcartType)} d'écart-type.`,
          },
          {
            texte: `Rien : un échantillon de ${qte(x.r.n)} enceintes est trop petit pour juger la production d'une journée entière`,
            juste: dedans,
            retour: `Non : l'échantillon est assez grand pour la loi normale, et l'intervalle chiffre justement l'incertitude. Elle reste de ${g(x.icInconnu.demi)} de part et d'autre.`,
          },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-ligne",
      objectifs: [1, 3],
      type: "simulation",
      titre: "Le laboratoire de la ligne",
      question: () =>
        "Faites varier le réglage de la machine, la dispersion du poids, la taille de l'échantillon et la confiance de l'intervalle : le tableau suit les défauts de poids, leur coût et la précision de l'estimation. Relevez le défi.",
      leviers: (c) => {
        const x = qualiteDuChapitre(c);
        const L = LEVIERS_DE_LA_LIGNE;
        return [
          { code: "reglage", libelle: "Poids moyen réglé", unite: "g", ...L.reglage, depart: x.depart.reglage },
          { code: "ecartType", libelle: "Écart-type du poids", unite: "g", ...L.ecartType, depart: x.depart.ecartType },
          { code: "taille", libelle: "Enceintes pesées dans l'échantillon", unite: "enceintes", ...L.taille, depart: x.depart.taille },
          {
            code: "confiance",
            libelle: "Confiance de l'intervalle",
            unite: "%",
            min: L.confiances[0],
            max: L.confiances.at(-1)!,
            pas: 1,
            depart: x.depart.confiance,
            choix: L.confiances.map((v) => ({ valeur: v, libelle: `${qte(v)} %` })),
          },
        ];
      },
      lecture: (c, p) => {
        const x = qualiteDuChapitre(c);
        const l = laboratoireDeLaLigne(x.f, p);
        const d = laboratoireDeLaLigne(x.f, x.depart);
        return [
          { libelle: "Part hors tolérance", montant: arrondi(l.hors * 100, 2), unite: "%", reference: arrondi(d.hors * 100, 2) },
          { libelle: "Défauts de poids dans l'année", montant: arrondi(l.nombre, 0), unite: "enceintes", reference: arrondi(d.nombre, 0), fort: true },
          { libelle: "Coût de ces défauts dans l'année", montant: l.cout, reference: d.cout },
          { libelle: "Demi-largeur de l'intervalle de confiance", montant: arrondi(l.demi, 2), unite: "g", reference: arrondi(d.demi, 2), fort: true },
        ];
      },
      // Les parts hors tolérance selon le réglage ne sont pas des droites : la part totale dessine un U, au plus bas à la cible.
      graphique: (c) => {
        const x = qualiteDuChapitre(c);
        return {
          levier: "reglage",
          unite: "%",
          courbes: [
            { libelle: "Part hors tolérance", valeur: (p) => arrondi(laboratoireDeLaLigne(x.f, p).hors * 100, 2) },
            { libelle: `Part sous ${qte(x.bas)} g`, valeur: (p) => arrondi(laboratoireDeLaLigne(x.f, p).sous * 100, 2) },
            { libelle: `Part au-dessus de ${qte(x.haut)} g`, valeur: (p) => arrondi(laboratoireDeLaLigne(x.f, p).dessus * 100, 2) },
          ],
        };
      },
      defi: (c) => {
        const x = qualiteDuChapitre(c);
        return {
          consigne: `Ramenez les défauts de poids à ${qte(DEFI_DE_LA_LIGNE.defautsAuPlus)} au plus dans l'année, et estimez le poids moyen à ${g(DEFI_DE_LA_LIGNE.precisionAuPlus, 1)} près au plus.`,
          atteint: (p) => defiDeLaLigne(x.f, p),
          indice: (p) => {
            const l = laboratoireDeLaLigne(x.f, p);
            return `${qte(arrondi(l.nombre, 0))} défauts de poids, une estimation à ${g(arrondi(l.demi, 2))} près. Centrez la machine, resserrez la dispersion, pesez plus d'enceintes, ou acceptez moins de confiance.`;
          },
          solution: { ...x.solution },
        };
      },
      explication: (c, p) => {
        const x = qualiteDuChapitre(c);
        const l = laboratoireDeLaLigne(x.f, p);
        return [
          `Défi relevé : ${qte(arrondi(l.nombre, 0))} défauts de poids, ${eur(l.cout)} par an, et une moyenne connue à ${g(arrondi(l.demi, 2))} près.`,
          `Centrer la machine ne suffit pas : à ${g(x.P.ecartType, 0)} d'écart-type, il reste ${qte(arrondi(x.regle.nombre, 0))} défauts. Il faut aussi réduire la dispersion, par l'entretien et la méthode. La précision, elle, vient de la taille de l'échantillon : elle progresse comme √n, et chaque point de confiance de plus la fait reculer.`,
        ];
      },
    },
    {
      id: "la-taille-de-l-echantillon",
      objectifs: [3],
      type: "montants",
      titre: "Combien d'enceintes peser",
      question: (c) => {
        const x = qualiteDuChapitre(c);
        return `Le directeur de production veut connaître le poids moyen à ${g(PRECISION_VOULUE, 0)} près. L'écart-type de la production vaut ${g(x.P.ecartType, 0)}. Sans formule : combien d'enceintes faut-il peser au moins, à 95 %, puis à 99 % de confiance ?`;
      },
      champs: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          { libelle: "Enceintes à peser, à 95 %", attendu: x.taille95, tolerance: 1, calcul: `${tt(x.T.centreA95)} × ${qte(x.P.ecartType)} ÷ √n ≤ ${qte(PRECISION_VOULUE)} : n ≥ (${tt(x.T.centreA95)} × ${qte(x.P.ecartType)} ÷ ${qte(PRECISION_VOULUE)})² = ${qte((x.T.centreA95 * x.P.ecartType) ** 2)}, soit ${qte(x.taille95)}` },
          { libelle: "Enceintes à peser, à 99 %", attendu: x.taille99, tolerance: 3, calcul: `n ≥ (${tt(x.T.centreA99)} × ${qte(x.P.ecartType)} ÷ ${qte(PRECISION_VOULUE)})² = ${qte((x.T.centreA99 * x.P.ecartType) ** 2)}, soit ${qte(x.taille99)}` },
        ];
      },
      explication: (c) => {
        const x = qualiteDuChapitre(c);
        return [
          `Diviser la demi-largeur par 2 demande 4 fois plus d'enceintes : la précision progresse comme √n. Passer de 95 à 99 % de confiance en demande ${qte(x.taille99 - x.taille95)} de plus. Ce qui est gagné en certitude se paie en précision, ou en pesées.`,
        ];
      },
    },
    {
      id: "les-limites",
      objectifs: [4],
      type: "choix",
      titre: "Les risques des outils de la qualité",
      question: (c) => `Pour gagner du temps, le contrôleur propose de peser les ${qte(qualiteDuChapitre(c).r.n)} premières enceintes de chaque matinée, toujours au même poste. Quel est le risque de cette pratique ?`,
      options: (c) => [
        {
          texte: "L'échantillon n'est plus pris au hasard",
          juste: true,
          retour:
            "Oui. L'intervalle de confiance suppose un échantillon tiré au hasard dans toute la production. Les premières enceintes du matin sortent d'une buse propre, dans un atelier frais : elles cachent la dérive de l'après-midi. L'outil donnerait une fausse assurance.",
        },
        {
          texte: `Aucun : ${qte(qualiteDuChapitre(c).r.n)} enceintes suffisent, quelle que soit la façon de les choisir`,
          juste: false,
          retour: "Non : la taille ne corrige pas un biais. Un grand échantillon mal choisi estime avec précision une moyenne qui n'est pas la bonne.",
        },
        {
          texte: "L'intervalle serait trop large, puisque le matin la dispersion est plus forte",
          juste: false,
          retour: "Non : le matin, la buse est propre. Le risque n'est pas un intervalle trop large, mais un intervalle juste sur une partie de la production seulement.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      tableau: tableauDeLaLigne,
      texte: (c) => {
        const x = qualiteDuChapitre(c);
        const [a, b] = x.pareto.causes;
        return [
          `Le diagramme de Pareto a désigné la priorité : le poids hors tolérance et la soudure, ${pct(b!.cumul, 1)} des ${qte(x.pareto.total)} défauts ; le diagramme d'Ishikawa en a rangé les causes selon les 5 M. La loi normale a chiffré le poids : ${qte(x.regle.nombre)} enceintes hors tolérance par an, ligne bien réglée, ${qte(x.derive.nombre)} déréglée de ${g(POIDS_DERIVE - x.P.cible, 0)}, ${eur(x.surcout)} de plus.`,
          `Tout peser ne paie qu'à partir de ${qte(x.seuilPesee)} défauts de poids ; surveiller le réglage par échantillon coûte moins. La moyenne de ${qte(ECHANTILLON_HORAIRE)} enceintes varie √${qte(ECHANTILLON_HORAIRE)} fois moins qu'une enceinte ; le relevé du jour estime le poids moyen entre ${g(x.icInconnu.bas)} et ${g(x.icInconnu.haut)}, à 95 %, et ${qte(a!.nombre)} défauts de poids rappellent ce qu'une dérive coûte.`,
          "Au niveau de l'examen, vous savez bâtir un Pareto, ranger des causes selon les 5 M et calculer une part hors tolérance. Vous savez décrire la loi d'une moyenne d'échantillon, estimer une moyenne par un intervalle de confiance, dimensionner un échantillon, et dire ce que ces outils supposent.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "X̄ suit N(m ; σ ÷ √n). Estimation ponctuelle : x̄ pour m, s = σe × √(n ÷ (n − 1)) pour σ. Intervalle de confiance d'une moyenne : x̄ ± t × σ ÷ √n (s si σ est inconnu et n ≥ 30), t = 1,96 à 95 %, 2,575 à 99 %. Taille d'échantillon : n ≥ (t × σ ÷ précision)².",
    },
  ],
};
