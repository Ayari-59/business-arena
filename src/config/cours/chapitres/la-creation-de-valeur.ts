import type { Cas } from "../cas";
import { betaDesendette, bilanApres, creationDeValeur as creationDeValeurDuBilan, structureAuLevier } from "../monde/finance";
import { MARGE_DE_CREDIT_PAR_UNITE_DE_LEVIER, SALLE_DE_SEMINAIRE, TAUX_SANS_RISQUE } from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_LEVIER, RISQUE_DE_L_ESCALE, auCentieme, bilanDe, dE, enPct, eur, levierDeLEscale, nombre, pct, points, retranche } from "./l-effet-de-levier";

/**
 * CHAPITRE : LA CRÉATION DE VALEUR, RENTABILITÉ ÉCONOMIQUE ET COÛT DU CAPITAL (DSCG, UE2 Finance,
 * palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le bilan de
 * L'ESCALE au 31 décembre, son bêta et le marché financier sont figés dans
 * monde/projets-et-financement.ts, et le coût du capital se calcule par le modèle du cours
 * (monde/finance.ts : creationDeValeur, bilanApres, structureAuLevier). Une évolution du moteur
 * ne change rien ici.
 *
 * « L'effet de levier » a mesuré ce que l'outil rapporte (la rentabilité économique après impôt)
 * et ce que coûte la dette (le coût de l'endettement net après impôt). Ce chapitre y ajoute ce
 * qu'exigent les associés, le coût des capitaux propres par le MEDAF, avec un bêta réendetté par
 * la relation de Hamada ; il pondère les deux coûts par la structure du bilan (le CMPC), en tire la
 * valeur créée sur l'année (l'EVA) et la recoupe par le résultat résiduel. La simulation du cours
 * rejoue ensuite l'année avec une salle de séminaire (le scénario figé de la fiche, à la place du
 * rejeu de l'arène) : le résultat net monte, l'EVA baisse. Puis Hamada à partir d'un comparable
 * coté, le CMPC en U avec la marge de crédit, et la critique de Modigliani et Miller.
 *
 * LES HYPOTHÈSES DU COURS, dites à l'élève dans l'intro : le taux sans risque (3 %), la prime de
 * risque du marché (6 %) et le bêta de l'actif de l'hôtel (0,8) sont ceux de la fiche ; Hamada
 * suppose une dette sans risque, et le cours l'applique à une dette qui coûte plus que le taux sans
 * risque (l'approximation du DSCG) ; les pondérations sont celles du bilan, en valeur comptable,
 * dont la somme est l'actif économique : le CMPC × actif économique vaut alors l'exigence des
 * associés plus les charges financières après impôt, et l'EVA égale le résultat résiduel.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DSCG) :
 *   · guidé : intro, cout-des-capitaux-propres, cmpc (la formule est dans la question) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-valeur
 *     puis le-resultat-qui-couvre-le-capital (le résultat d'exploitation après impôt face au coût du
 *     capital, qui se croisent au résultat qui annule l'EVA) avant eva ; predire-l-exigence puis
 *     l-exigence-au-curseur (le résultat net face à l'exigence des associés, qui se croisent quand
 *     l'exigence égale la rentabilité des capitaux propres) avant residuel ; predire-la-structure
 *     puis le-laboratoire-de-la-structure (le CMPC en U) avant modigliani-miller ;
 *   · autonome : eva, verdict, residuel (ni formule ni chiffres à prendre ; le calcul de la
 *     correction montre le chemin) ;
 *   · expert : la-salle-de-seminaire et la-salle-cree-t-elle (une variante chiffrée : le résultat net
 *     monte, l'EVA baisse), hamada (désendetter le bêta d'un comparable, le réendetter à un autre
 *     levier), le-laboratoire-de-la-structure (βa, prime, levier et marge de crédit : le meilleur
 *     levier), modigliani-miller (une critique) ; puis la synthèse.
 */

/**
 * LE COMPARABLE COTÉ, hypothèse du cours pour l'étape de Hamada : un groupe hôtelier coté dont les
 * capitaux propres ont un bêta de 1,10, pour un levier de 0,5 (une dette nette égale à la moitié
 * de ses capitaux propres en valeur de marché), imposé à 25 %. C'est de lui que vient le bêta de
 * l'actif de L'ESCALE : désendetté, son bêta redonne celui de la fiche.
 */
export const COMPARABLE_COTE = { betaDesCapitauxPropres: 1.1, levier: 0.5 } as const;

/** LA VARIANTE DE HAMADA, hypothèse du cours : L'ESCALE porterait un levier de 2 (un rachat de parts payé par emprunt). */
export const LEVIER_DE_LA_VARIANTE = 2;

/** Les bornes du curseur du résultat d'exploitation, en euros. */
export const RESULTAT_DU_CURSEUR_DE_LA_VALEUR = { min: 100_000, max: 400_000 } as const;

/** Les bornes du curseur de l'exigence des associés, en points de base (100 points de base font 1 %). */
export const EXIGENCE_DU_CURSEUR = { min: 500, max: 3_000 } as const;

/** Les leviers du laboratoire de la structure : le bêta de l'actif, la prime de risque (%), le levier. */
export const LABORATOIRE_DE_LA_STRUCTURE = {
  beta: { min: 0.5, max: 1.2, pas: 0.05 },
  prime: { min: 4, max: 8, pas: 0.5 },
  levier: { min: 0, max: 3, pas: 0.01 },
} as const;

const auCentime = (x: number) => Math.round(x * 100) / 100 || 0;

/** Le coût du capital au levier `levier`, pour un bêta de l'actif et une prime (%), avec ou sans la marge de crédit. */
export function laboratoireDeLaStructure(c: Pick<Cas, "code">, p: { beta: number; prime: number; levier: number; marge: number }) {
  return structureAuLevier(bilanDe(c), { tauxSansRisque: TAUX_SANS_RISQUE, prime: p.prime / 100, betaDeLActif: p.beta }, p.levier, p.marge * MARGE_DE_CREDIT_PAR_UNITE_DE_LEVIER);
}

export type Verdict = "cree" | "detruit";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** La valeur créée par L'ESCALE, et tout ce que le chapitre et son cas demandent. */
export function valeurDeLEscale(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const x = calculer(c);
  calculs.set(c.code, x);
  return x;
}

function calculer(c: Pick<Cas, "code">) {
  const l = levierDeLEscale(c);
  const { b, a, r, t } = l;
  const v = creationDeValeurDuBilan(b, RISQUE_DE_L_ESCALE);
  const beta = auCentieme(v.betaDesCapitauxPropres);
  const kcp = auCentieme((RISQUE_DE_L_ESCALE.tauxSansRisque + beta * RISQUE_DE_L_ESCALE.prime) * 100);
  const poidsCP = enPct(v.poidsDesCapitauxPropres);
  const poidsD = enPct(v.poidsDeLaDette);
  const cmpc = auCentieme((kcp * poidsCP + r.i * poidsD) / 100);
  // Le coût du capital en euros : l'exigence des associés plus les charges financières après impôt.
  const coutDuCapital = auCentime(v.exigenceDesAssocies + a.chargesFinancieresApresImpot);
  // Un centième de point sur l'actif économique : l'écart que laissent les taux arrondis de l'élève.
  const toleranceEva = Math.ceil(a.actifEconomique * 0.0001);
  // Le curseur de l'exigence : la plus haute, en points de base, que le résultat net couvre.
  const exigenceLimite = Math.floor((a.resultatNet / a.capitauxPropres) * 10_000 + 1e-9);
  // La salle de séminaire, le scénario figé de la fiche.
  const avec = creationDeValeurDuBilan(bilanApres(b, { investissement: SALLE_DE_SEMINAIRE }), RISQUE_DE_L_ESCALE);
  const dotation = auCentime(SALLE_DE_SEMINAIRE.montant / SALLE_DE_SEMINAIRE.dureeDAmortissement);
  const capitalDeLaSalle = auCentime(SALLE_DE_SEMINAIRE.montant - dotation);
  const exploitationDeLaSalle = auCentime((SALLE_DE_SEMINAIRE.excedentBrutEnPlus - dotation) * (1 - t));
  // Hamada : le bêta du comparable désendetté, puis réendetté au levier de la variante.
  const betaDuComparable = auCentieme(betaDesendette(COMPARABLE_COTE.betaDesCapitauxPropres, COMPARABLE_COTE.levier, t));
  const betaDeLaVariante = auCentieme(betaDuComparable * (1 + (1 - t) * LEVIER_DE_LA_VARIANTE));
  const kcpDeLaVariante = auCentieme((RISQUE_DE_L_ESCALE.tauxSansRisque + betaDeLaVariante * RISQUE_DE_L_ESCALE.prime) * 100);
  // Le laboratoire : le meilleur levier avec la marge de crédit, au pas du levier, à βa et prime de la fiche.
  const fiche = { beta: RISQUE_DE_L_ESCALE.betaDeLActif, prime: enPct(RISQUE_DE_L_ESCALE.prime), marge: 1 };
  const pas = LABORATOIRE_DE_LA_STRUCTURE.levier.pas;
  const grille = Array.from({ length: Math.round(LABORATOIRE_DE_LA_STRUCTURE.levier.max / pas) + 1 }, (_, k) => auCentieme(k * pas));
  const meilleurLevier = grille.reduce((m, x) => (laboratoireDeLaStructure(c, { ...fiche, levier: x }).eva > laboratoireDeLaStructure(c, { ...fiche, levier: m }).eva ? x : m), 0);
  return {
    ...l,
    v,
    beta,
    kcp,
    poidsCP,
    poidsD,
    cmpc,
    ecart: auCentieme(r.re - cmpc),
    coutDuCapital,
    toleranceEva,
    toleranceExploitation: Math.ceil(toleranceEva / (1 - t)),
    exigenceLimite,
    verdict: (v.eva > 0 ? "cree" : "detruit") as Verdict,
    avec,
    kcpAvec: enPct(avec.kcp),
    cmpcAvec: enPct(avec.cmpc),
    variationDuNet: auCentime(avec.resultatNet - a.resultatNet),
    variationDeLEva: auCentime(avec.eva - v.eva),
    toleranceSalle: Math.ceil(avec.capitauxPropres * 0.00005),
    dotation,
    capitalDeLaSalle,
    exploitationDeLaSalle,
    rentabiliteDeLaSalle: enPct(exploitationDeLaSalle / capitalDeLaSalle),
    interetsDeLaSalle: auCentime(b.tauxDeLEmprunt * SALLE_DE_SEMINAIRE.montant * (1 - t)),
    laSalleDetruit: avec.eva < v.eva && avec.resultatNet > a.resultatNet,
    betaDuComparable,
    betaDeLaVariante,
    kcpDeLaVariante,
    fiche,
    meilleurLevier,
    departDuLaboratoire: { ...fiche, levier: auCentieme(a.levier) },
  };
}

export type ValeurDeLEscale = ReturnType<typeof calculer>;

/** Les chiffres de L'ESCALE au 31 décembre, et les hypothèses de la fiche. */
function tableauDesHypotheses(c: Cas): TableauDeDonnees {
  const x = valeurDeLEscale(c);
  return {
    titre: `Les chiffres ${dE(x.entreprise)} au 31 décembre, et le marché financier du cours`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Actif économique", valeurs: [eur(x.a.actifEconomique)] },
      { libelle: "Capitaux propres", valeurs: [eur(x.a.capitauxPropres)] },
      { libelle: "Endettement financier net", valeurs: [eur(x.a.endettementNet)] },
      { libelle: "Résultat d'exploitation de l'année", valeurs: [eur(x.b.resultatDExploitation)] },
      { libelle: "Charges financières de l'année", valeurs: [eur(x.a.chargesFinancieres)] },
      { libelle: "Résultat net de l'année", valeurs: [eur(x.a.resultatNet)] },
      { libelle: "Rentabilité économique après impôt, Re", valeurs: [pct(x.r.re)] },
      { libelle: "Coût de l'endettement net après impôt, i", valeurs: [pct(x.r.i)] },
      { libelle: "Taux de l'impôt sur les sociétés", valeurs: [pct(x.tPct)] },
      { libelle: "Taux sans risque", valeurs: [pct(enPct(RISQUE_DE_L_ESCALE.tauxSansRisque))] },
      { libelle: "Prime de risque du marché", valeurs: [pct(enPct(RISQUE_DE_L_ESCALE.prime))] },
      { libelle: "Bêta de l'actif économique de l'hôtel", valeurs: [nombre(RISQUE_DE_L_ESCALE.betaDeLActif)] },
    ],
  };
}

export const LA_CREATION_DE_VALEUR: Chapitre = {
  code: "la-creation-de-valeur",
  parcours: "dscg-finance",
  palier: 4,
  blocs: ["DSCG UE2 · Finance"],
  titre: "La création de valeur : rentabilité économique et coût du capital",
  accroche:
    "Un bénéfice ne suffit pas : les associés attendent de leur argent plus que ce qu'il rapporterait sans risque. L'entreprise crée de la valeur quand son outil rapporte plus que ne coûtent, ensemble, la dette et les capitaux propres. Le MEDAF, Hamada, le CMPC en U et l'EVA, sur le bilan de l'hôtel du cours.",
  objectifs: [
    "Estimer le coût des capitaux propres par le MEDAF, avec un bêta réendetté par la relation de Hamada",
    "Calculer le coût moyen pondéré du capital à partir du bilan",
    "Calculer l'EVA, la recouper par le résultat résiduel, et dire si l'entreprise crée ou détruit de la valeur",
    "Montrer qu'un investissement peut faire monter le résultat net et baisser l'EVA",
    "Discuter la structure financière qui minimise le coût du capital, face à Modigliani et Miller",
  ],
  libre: false,
  prerequis: ["l-effet-de-levier"],
  entreprises: {
    codes: ENTREPRISES_DU_LEVIER,
    pourquoi:
      "le coût du capital se pondère sur un bilan endetté, comme l'effet de levier : celui de L'ESCALE, l'hôtel du cours, sert de cas d'école quelle que soit votre entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que coûte le capital",
      notions: ["profitability_vs_return", "enterprise_value"],
      tableau: tableauDesHypotheses,
      texte: (c) => {
        const x = valeurDeLEscale(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, sur le bilan ${dE(x.entreprise)} au 31 décembre, celui de « L'effet de levier ». L'hôtel gagne ${eur(x.a.resultatNet)}, et son outil rapporte ${pct(x.r.re)} après impôt. Est-ce assez ? La banque est payée par les charges financières ; les associés ne reçoivent que ce qui reste, et ils l'attendent plus élevé que ce que leur rapporterait un placement sans risque, puisqu'ils portent le risque de l'exploitation.`,
          "Le capital a donc un coût, même celui des associés, qui n'apparaît dans aucun compte : c'est ce qu'ils renoncent à gagner ailleurs pour un risque comparable. L'entreprise crée de la valeur quand son outil rapporte plus que ne coûtent, pondérés, la dette et les capitaux propres.",
          `Ce que la simulation suppose. Le taux sans risque, la prime de risque du marché et le bêta de l'activité de l'hôtel sont ceux de la fiche, au tableau. La relation de Hamada suppose une dette sans risque ; le cours l'applique à une dette qui coûte ${pct(x.taux)}, plus que le taux sans risque, comme le fait le DSCG. Les poids des capitaux propres et de la dette sont ceux du bilan, en valeur comptable.`,
        ];
      },
      repere: () => "kcp = taux sans risque + βcp × prime de risque ; βcp = βa × (1 + (1 − t) × D/CP) ; EVA = (Re − CMPC) × actif économique.",
    },
    {
      id: "cout-des-capitaux-propres",
      type: "montants",
      titre: "Le coût des capitaux propres",
      notions: ["total_shareholder_return"],
      tableau: tableauDesHypotheses,
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `Plus l'hôtel est endetté, plus ses associés portent de risque. Calculez le bêta des capitaux propres, βcp = ${nombre(RISQUE_DE_L_ESCALE.betaDeLActif)} × (1 + (1 − ${nombre(x.t)}) × endettement net ÷ capitaux propres), à deux décimales, puis le coût des capitaux propres, kcp = ${pct(enPct(RISQUE_DE_L_ESCALE.tauxSansRisque))} + βcp × ${pct(enPct(RISQUE_DE_L_ESCALE.prime))} (en %).`;
      },
      champs: (c) => {
        const x = valeurDeLEscale(c);
        return [
          {
            libelle: "Bêta des capitaux propres, βcp",
            attendu: x.beta,
            calcul: `${nombre(RISQUE_DE_L_ESCALE.betaDeLActif)} × (1 + ${nombre(1 - x.t)} × ${eur(x.a.endettementNet)} ÷ ${eur(x.a.capitauxPropres)}) = ${nombre(x.beta)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Coût des capitaux propres, kcp (%)",
            attendu: x.kcp,
            calcul: `${pct(enPct(RISQUE_DE_L_ESCALE.tauxSansRisque))} + ${nombre(x.beta)} × ${pct(enPct(RISQUE_DE_L_ESCALE.prime))} = ${pct(x.kcp)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const x = valeurDeLEscale(c);
        return [
          `Les associés ${dE(x.entreprise)} exigent ${pct(x.kcp)} par an : ${pct(enPct(RISQUE_DE_L_ESCALE.tauxSansRisque))} pour le temps, et ${points(auCentieme(x.kcp - enPct(RISQUE_DE_L_ESCALE.tauxSansRisque)))} pour le risque. L'activité d'un hôtel de ville est moins risquée que le marché (un bêta de ${nombre(RISQUE_DE_L_ESCALE.betaDeLActif)}) ; c'est la dette qui fait monter le bêta des associés à ${nombre(x.beta)}, parce qu'ils sont payés après la banque.`,
          `C'est bien plus que les ${pct(x.r.i)} que coûte l'endettement net : le prêteur passe en premier, il prend moins de risque, et ses intérêts se déduisent de l'impôt.`,
        ];
      },
    },
    {
      id: "cmpc",
      type: "montants",
      titre: "Le coût moyen pondéré du capital",
      notions: ["profitability_vs_return", "loan_schedule"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `L'outil est financé par les capitaux propres et par l'endettement net, dont la somme est l'actif économique. Calculez le poids de chacun dans l'actif économique (en %), puis le coût moyen pondéré du capital, CMPC = kcp × poids des capitaux propres + i × poids de la dette, avec kcp = ${pct(x.kcp)} et i = ${pct(x.r.i)} (en %).`;
      },
      champs: (c) => {
        const x = valeurDeLEscale(c);
        return [
          { libelle: "Poids des capitaux propres (%)", attendu: x.poidsCP, calcul: `${eur(x.a.capitauxPropres)} ÷ ${eur(x.a.actifEconomique)} × 100 = ${pct(x.poidsCP)}`, tolerance: 0.01 },
          { libelle: "Poids de l'endettement net (%)", attendu: x.poidsD, calcul: `${eur(x.a.endettementNet)} ÷ ${eur(x.a.actifEconomique)} × 100 = ${pct(x.poidsD)}`, tolerance: 0.01 },
          { libelle: "Coût moyen pondéré du capital, CMPC (%)", attendu: x.cmpc, calcul: `${pct(x.kcp)} × ${pct(x.poidsCP)} + ${pct(x.r.i)} × ${pct(x.poidsD)} = ${pct(x.cmpc)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const x = valeurDeLEscale(c);
        return [
          `Chaque tranche de 100 € d'actif économique coûte ${nombre(x.cmpc)} € par an à ceux qui la financent : c'est le rendement que l'outil doit au moins dégager pour que ni la banque ni les associés ne perdent à financer l'outil. En euros, ${eur(x.v.exigenceDesAssocies)} pour les associés et ${eur(x.a.chargesFinancieresApresImpot)} pour la banque, après impôt : ${eur(x.coutDuCapital)}.`,
          "Les poids sont ici ceux du bilan, en valeur comptable. Dans une société cotée, on pondère par la valeur de marché des capitaux propres, qu'un hôtel non coté n'a pas.",
        ];
      },
    },
    {
      id: "predire-la-valeur",
      type: "choix",
      titre: "Pariez sur la valeur créée",
      notions: ["enterprise_value"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `Avant de calculer, pariez. L'hôtel gagne ${eur(x.a.resultatNet)} de résultat net. La valeur qu'il crée sur l'année, au-delà de ce qu'exigent la banque et les associés, sera…`;
      },
      options: (c) => {
        const x = valeurDeLEscale(c);
        const voir = "Faites varier le résultat d'exploitation à l'étape suivante : le curseur montre ce que l'outil doit rapporter pour couvrir le capital.";
        const moins = x.v.eva < x.a.resultatNet;
        return [
          { texte: "Moins que son résultat net : il faut d'abord payer ce qu'exigent les associés", juste: moins, retour: `${moins ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Égale à son résultat net : tout bénéfice est de la valeur créée", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus que son résultat net : la dette ne coûte presque rien après impôt", juste: !moins, retour: `${!moins ? "Bon pari." : "Pari à vérifier."} ${voir}` },
        ];
      },
    },
    {
      id: "le-resultat-qui-couvre-le-capital",
      type: "curseur",
      titre: "Faites varier le résultat d'exploitation",
      notions: ["enterprise_value", "profitability_vs_return"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `Faites varier le résultat d'exploitation de ${eur(RESULTAT_DU_CURSEUR_DE_LA_VALEUR.min)} à ${eur(RESULTAT_DU_CURSEUR_DE_LA_VALEUR.max)}, le bilan restant celui du 31 décembre. Une droite donne ce que l'outil rapporte après impôt ; l'autre ce que coûte le capital qui le finance, ${eur(x.coutDuCapital)} par an (les ${pct(x.kcp)} des associés et les charges financières après impôt). Placez le curseur sur le plus petit résultat d'exploitation qui couvre le coût du capital, puis validez.`;
      },
      grandeur: () => ({ libelle: "Résultat d'exploitation de l'année", unite: "€" }),
      cible: (c) => {
        const x = valeurDeLEscale(c);
        return { attendu: Math.ceil(x.coutDuCapital / (1 - x.t) - 1e-9), min: RESULTAT_DU_CURSEUR_DE_LA_VALEUR.min, max: RESULTAT_DU_CURSEUR_DE_LA_VALEUR.max };
      },
      zones: ["Valeur créée", "Valeur détruite"],
      rates: () => ({
        dessous: "À cette position, l'outil ne rapporte pas ce que coûte le capital qui le finance : l'année détruit de la valeur.",
        dessus: "Plus bas, l'outil couvre encore le coût du capital : cherchez le plus petit résultat d'exploitation.",
      }),
      montrer: "Montrer le résultat qui couvre le capital",
      lecture: (c, rex) => {
        const x = valeurDeLEscale(c);
        const apresImpot = auCentime(rex * (1 - x.t));
        return [
          { libelle: "Résultat d'exploitation après impôt", montant: apresImpot },
          { libelle: "Exigence des associés", montant: x.v.exigenceDesAssocies },
          { libelle: "Charges financières après impôt", montant: x.a.chargesFinancieresApresImpot },
          { libelle: "Valeur créée sur l'année, l'EVA", montant: auCentime(apresImpot - x.coutDuCapital), fort: true },
        ];
      },
      droites: (c) => {
        const x = valeurDeLEscale(c);
        return {
          produit: (rex) => rex * (1 - x.t),
          cout: () => x.coutDuCapital,
          libelles: ["Ce que l'outil rapporte après impôt", "Ce que coûte le capital qui le finance"],
        };
      },
      explication: (c) => {
        const x = valeurDeLEscale(c);
        return [
          `Les deux droites se croisent à ${eur(x.v.resultatDExploitationMinimal)} de résultat d'exploitation : là, l'outil rapporte après impôt exactement ce que coûte le capital, et l'année ne crée ni ne détruit de valeur. Entre ce point et le seuil de massue de « L'effet de levier », ${eur(x.a.seuilDeMassue)}, l'hôtel gagne de l'argent, la dette joue même pour les associés, et pourtant il détruit de la valeur.`,
          `À ${eur(x.b.resultatDExploitation)}, l'écart entre les deux droites est la valeur créée, l'EVA. L'étape suivante la calcule par les taux.`,
        ];
      },
    },
    {
      id: "eva",
      type: "montants",
      titre: "La valeur créée sur l'année",
      notions: ["enterprise_value", "profitability_vs_return"],
      question: () =>
        "Sans formule cette fois. À partir de la rentabilité économique et du CMPC, calculez l'écart entre ce que rapporte l'outil et ce que coûte le capital (en points), la valeur créée sur l'année, l'EVA, puis retrouvez le résultat d'exploitation du curseur, celui qui l'annule.",
      champs: (c) => {
        const x = valeurDeLEscale(c);
        return [
          { libelle: "Re moins CMPC (points)", attendu: x.ecart, calcul: `${pct(x.r.re)} − ${pct(x.cmpc)} = ${points(x.ecart)}`, tolerance: 0.02 },
          {
            libelle: "EVA de l'année",
            attendu: x.v.eva,
            calcul: `(Re − CMPC) × actif économique, soit ${pct(x.ecart)} × ${eur(x.a.actifEconomique)} aux taux arrondis ; au centime, ${eur(x.a.resultatDExploitationApresImpot)} − ${eur(x.coutDuCapital)} = ${eur(x.v.eva)}`,
            tolerance: x.toleranceEva,
          },
          {
            libelle: "Résultat d'exploitation qui annule l'EVA",
            attendu: x.v.resultatDExploitationMinimal,
            calcul: `CMPC × actif économique ÷ (1 − t) : ${eur(x.coutDuCapital)} ÷ ${nombre(1 - x.t)} = ${eur(x.v.resultatDExploitationMinimal)}`,
            tolerance: x.toleranceExploitation,
          },
        ];
      },
      explication: (c) => {
        const x = valeurDeLEscale(c);
        return [
          x.v.eva >= 0
            ? `L'outil rapporte ${points(x.ecart)} de plus que ne coûte le capital qui le finance : sur l'année, ${eur(x.v.eva)} de valeur créée, au-delà de ce qu'exigeaient la banque et les associés.`
            : `L'outil rapporte ${points(-x.ecart)} de moins que ne coûte le capital qui le finance : sur l'année, ${eur(-x.v.eva)} de valeur détruite, malgré le bénéfice.`,
          "L'EVA, valeur ajoutée économique, mesure ce que l'année laisse aux apporteurs de capitaux au-delà de leur exigence. Additionnées et actualisées au CMPC, les EVA à venir font la valeur que le marché ajoute à l'actif économique.",
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "Créer ou détruire de la valeur",
      notions: ["enterprise_value"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `${x.entreprise} finit l'année avec ${eur(x.a.resultatNet)} de résultat net, une rentabilité économique de ${pct(x.r.re)} et un CMPC de ${pct(x.cmpc)}. Que dire de son année ?`;
      },
      options: (c) => {
        const x = valeurDeLEscale(c);
        return [
          {
            texte: "Elle crée de la valeur : son outil rapporte plus que ne coûte le capital",
            juste: x.verdict === "cree",
            retour:
              x.verdict === "cree"
                ? `Oui : ${pct(x.r.re)} contre ${pct(x.cmpc)}, soit ${eur(x.v.eva)} de valeur créée. Les associés reçoivent plus que les ${pct(x.kcp)} qu'ils exigeaient.`
                : `Non : l'outil rapporte ${pct(x.r.re)}, moins que les ${pct(x.cmpc)} que coûte le capital.`,
          },
          {
            texte: "Elle détruit de la valeur : son outil rapporte moins que ne coûte le capital",
            juste: x.verdict === "detruit",
            retour:
              x.verdict === "detruit"
                ? `Oui : ${pct(x.r.re)} contre ${pct(x.cmpc)}, soit ${eur(-x.v.eva)} de valeur détruite.`
                : `Non : l'outil rapporte ${pct(x.r.re)}, plus que les ${pct(x.cmpc)} que coûte le capital.`,
          },
          {
            texte: "Le bénéfice suffit : une entreprise qui gagne de l'argent crée forcément de la valeur",
            juste: false,
            retour: `Non : le résultat net vient après la rémunération de la banque, pas après celle des associés. Pour créer de la valeur, il doit dépasser ce qu'ils exigent, ${eur(x.v.exigenceDesAssocies)} cette année.`,
          },
        ];
      },
    },
    {
      id: "predire-l-exigence",
      type: "choix",
      titre: "Pariez sur l'exigence que l'hôtel couvre",
      notions: ["total_shareholder_return", "enterprise_value"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `Les associés exigent ${pct(x.kcp)}. Un investisseur plus exigeant entrerait au capital. Avant de calculer, pariez : jusqu'à quelle exigence sur les capitaux propres l'année de l'hôtel crée-t-elle encore de la valeur ?`;
      },
      options: (c) => {
        const x = valeurDeLEscale(c);
        const voir = "Faites monter l'exigence à l'étape suivante : le curseur montre où la valeur créée s'annule.";
        return [
          { texte: `Jusqu'à ${pct(x.r.rcp)}, la rentabilité des capitaux propres`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `Jusqu'à ${pct(x.r.re)}, la rentabilité économique de l'outil`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Jusqu'à ${pct(x.cmpc)}, le coût moyen pondéré du capital`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-exigence-au-curseur",
      type: "curseur",
      titre: "Faites monter l'exigence des associés",
      notions: ["total_shareholder_return", "enterprise_value"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `Faites varier l'exigence des associés de ${nombre(EXIGENCE_DU_CURSEUR.min)} à ${nombre(EXIGENCE_DU_CURSEUR.max)} points de base (100 points de base font 1 %), sur leurs ${eur(x.a.capitauxPropres)}. Une droite donne le résultat net, qui ne change pas ; l'autre ce qu'exigent les associés. Placez le curseur sur la plus haute exigence que le résultat net couvre, puis validez.`;
      },
      grandeur: () => ({ libelle: "Exigence des associés", unite: "points de base" }),
      sens: "plus-grande",
      cible: (c) => {
        const x = valeurDeLEscale(c);
        return { attendu: x.exigenceLimite, min: EXIGENCE_DU_CURSEUR.min, max: EXIGENCE_DU_CURSEUR.max };
      },
      zones: ["Valeur créée", "Valeur détruite"],
      rates: () => ({
        dessous: "Le résultat net couvre encore cette exigence : montez-la, cherchez la plus haute.",
        dessus: "À cette exigence, le résultat net ne suffit plus : l'année détruirait de la valeur.",
      }),
      montrer: "Montrer l'exigence limite",
      lecture: (c, pb) => {
        const x = valeurDeLEscale(c);
        const exigence = auCentime((pb / 10_000) * x.a.capitauxPropres);
        return [
          { libelle: "Résultat net de l'année", montant: x.a.resultatNet },
          { libelle: "Exigence des associés", montant: exigence },
          { libelle: "Résultat résiduel, l'EVA", montant: auCentime(x.a.resultatNet - exigence), fort: true },
        ];
      },
      droites: (c) => {
        const x = valeurDeLEscale(c);
        return {
          produit: () => x.a.resultatNet,
          cout: (pb) => (pb / 10_000) * x.a.capitauxPropres,
          libelles: ["Résultat net de l'année", "Ce qu'exigent les associés"],
        };
      },
      explication: (c) => {
        const x = valeurDeLEscale(c);
        return [
          `L'année crée de la valeur jusqu'à une exigence de ${pct(x.exigenceLimite / 100)} : la rentabilité des capitaux propres, ${pct(x.r.rcp)}. Créer de la valeur, c'est donner aux associés plus qu'ils n'exigent : Rcp > kcp, ou, en euros, un résultat net au-dessus de leur exigence.`,
          `À ${pct(x.kcp)}, l'écart entre les deux droites est le résultat résiduel. Il doit retrouver l'EVA : l'étape suivante le vérifie.`,
        ];
      },
    },
    {
      id: "residuel",
      type: "montants",
      titre: "Le résultat résiduel, pour recouper",
      notions: ["total_shareholder_return"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `Sans formule cette fois. Les associés exigent ${pct(x.kcp)} sur leurs capitaux propres. Calculez ce que cette exigence représente en euros, puis le résultat résiduel, ce qui reste du résultat net une fois l'exigence payée.`;
      },
      champs: (c) => {
        const x = valeurDeLEscale(c);
        return [
          { libelle: "Exigence des associés", attendu: x.v.exigenceDesAssocies, calcul: `${pct(x.kcp)} × ${eur(x.a.capitauxPropres)} = ${eur(x.v.exigenceDesAssocies)}`, tolerance: 1 },
          { libelle: "Résultat résiduel", attendu: x.v.resultatResiduel, calcul: `${eur(x.a.resultatNet)} − ${retranche(x.v.exigenceDesAssocies)} = ${eur(x.v.resultatResiduel)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = valeurDeLEscale(c);
        return [
          `Le résultat résiduel, ${eur(x.v.resultatResiduel)}, est l'EVA de l'étape précédente, au centime.`,
          "Ce n'est pas un hasard : l'EVA retire de ce que rapporte l'outil le coût de la dette et l'exigence des associés ; le résultat net a déjà retiré le coût de la dette. Les deux disent la même chose, l'un du côté de l'outil, l'autre du côté des associés, dès que les poids du CMPC sont ceux du bilan.",
        ];
      },
    },
    {
      id: "la-salle-de-seminaire",
      type: "montants",
      titre: "Variante : une salle de séminaire",
      notions: ["enterprise_value", "capacity"],
      tableau: (c) => {
        const x = valeurDeLEscale(c);
        const s = x.avec;
        return {
          titre: "L'année, sans et avec la salle de séminaire",
          colonnes: ["Sans", "Avec"],
          lignes: [
            { libelle: "Résultat d'exploitation", valeurs: [eur(x.b.resultatDExploitation), eur(auCentime(s.resultatAvantImpot + s.chargesFinancieres))] },
            { libelle: "Charges financières", valeurs: [eur(x.a.chargesFinancieres), eur(s.chargesFinancieres)] },
            { libelle: "Résultat net", valeurs: [eur(x.a.resultatNet), eur(s.resultatNet)] },
            { libelle: "Actif économique au 31 décembre", valeurs: [eur(x.a.actifEconomique), eur(s.actifEconomique)] },
            { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(x.a.capitauxPropres), eur(s.capitauxPropres)] },
            { libelle: "Endettement net au 31 décembre", valeurs: [eur(x.a.endettementNet), eur(s.endettementNet)] },
            { libelle: "Coût des capitaux propres, kcp", valeurs: [pct(x.kcp), pct(x.kcpAvec)] },
          ],
        };
      },
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `La simulation du cours rejoue l'année avec ${SALLE_DE_SEMINAIRE.libelle} : ${eur(SALLE_DE_SEMINAIRE.montant)} d'aménagements au 1er janvier, amortis sur ${nombre(SALLE_DE_SEMINAIRE.dureeDAmortissement)} ans, payés par un nouvel emprunt à ${pct(x.taux)}, pour ${eur(SALLE_DE_SEMINAIRE.excedentBrutEnPlus)} d'excédent brut d'exploitation en plus. Le kcp du tableau est réendetté par Hamada. Calculez la variation du résultat net, l'EVA avec la salle, puis sa variation (avec moins sans).`;
      },
      champs: (c) => {
        const x = valeurDeLEscale(c);
        const s = x.avec;
        return [
          { libelle: "Variation du résultat net", attendu: x.variationDuNet, calcul: `${eur(s.resultatNet)} − ${eur(x.a.resultatNet)} = ${eur(x.variationDuNet)}` },
          {
            libelle: "EVA avec la salle",
            attendu: s.eva,
            calcul: `Résultat net − kcp × capitaux propres : ${eur(s.resultatNet)} − ${pct(x.kcpAvec)} × ${eur(s.capitauxPropres)} ≈ ${eur(s.eva)} (au kcp non arrondi)`,
            tolerance: x.toleranceSalle,
          },
          { libelle: "Variation de l'EVA", attendu: x.variationDeLEva, calcul: `${eur(s.eva)} − ${retranche(x.v.eva)} = ${eur(x.variationDeLEva)}`, tolerance: x.toleranceSalle },
        ];
      },
      explication: (c) => {
        const x = valeurDeLEscale(c);
        return [
          `La salle rapporte ${eur(x.exploitationDeLaSalle)} de résultat d'exploitation après impôt (l'excédent brut moins sa dotation de ${eur(x.dotation)}), et son emprunt coûte ${eur(x.interetsDeLaSalle)} après impôt : le résultat net ${x.variationDuNet >= 0 ? `gagne ${eur(x.variationDuNet)}` : `perd ${eur(-x.variationDuNet)}`}. Mais sur les ${eur(x.capitalDeLaSalle)} qu'elle mobilise au 31 décembre, elle ne rapporte que ${pct(x.rentabiliteDeLaSalle)}, moins que le CMPC, ${pct(x.cmpcAvec)} avec elle.`,
          `L'EVA passe de ${eur(x.v.eva)} à ${eur(x.avec.eva)}. Le résultat net ne compte que le coût de la dette ; l'EVA compte aussi ce qu'exigent les associés, dont le risque monte avec la dette de la salle.`,
        ];
      },
    },
    {
      id: "la-salle-cree-t-elle",
      type: "choix",
      titre: "La salle crée-t-elle de la valeur ?",
      notions: ["enterprise_value"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `Avec la salle, le résultat net ${x.variationDuNet >= 0 ? `gagne ${eur(x.variationDuNet)}` : `perd ${eur(-x.variationDuNet)}`}, et l'EVA ${x.variationDeLEva >= 0 ? `gagne ${eur(x.variationDeLEva)}` : `perd ${eur(-x.variationDeLEva)}`}. Le directeur veut la construire. Que lui dites-vous ?`;
      },
      options: (c) => {
        const x = valeurDeLEscale(c);
        const detruit = x.variationDeLEva < 0;
        return [
          {
            texte: "Non : elle rapporte moins que ne coûte le capital qu'elle mobilise, même si le résultat net monte",
            juste: detruit,
            retour: detruit
              ? `C'est cela : ${pct(x.rentabiliteDeLaSalle)} après impôt sur ${eur(x.capitalDeLaSalle)}, sous le CMPC. Un investissement crée de la valeur quand il rapporte plus que le coût du capital qui le finance, pas seulement plus que le taux de son emprunt.`
              : `Non : l'EVA monte de ${eur(x.variationDeLEva)}.`,
          },
          {
            texte: "Oui : le résultat net monte, donc les associés y gagnent",
            juste: false,
            retour: `Non : le résultat net monte de ${eur(x.variationDuNet)}, mais l'exigence des associés monte plus, avec le capital et le risque que la salle leur fait porter.`,
          },
          {
            texte: `Oui : elle rapporte plus que les ${pct(x.taux)} de son emprunt`,
            juste: !detruit,
            retour: !detruit
              ? `Oui : l'EVA monte de ${eur(x.variationDeLEva)}.`
              : "Non : c'est comparer l'investissement au seul coût de la dette. Le capital qui le finance coûte le CMPC : la dette de la salle rend les capitaux propres plus risqués, et leur exigence monte.",
          },
          {
            texte: "On ne peut pas le dire : il faut attendre que la salle soit amortie",
            juste: false,
            retour: "Non : l'EVA de chaque année se calcule dès la première. La salle ne rapporte pas assez sur le capital qu'elle mobilise ; son amortissement fait d'ailleurs baisser ce capital, pas monter ce qu'elle rapporte.",
          },
        ];
      },
    },
    {
      id: "hamada",
      type: "montants",
      titre: "Le bêta d'un comparable, désendetté puis réendetté",
      notions: ["total_shareholder_return"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `Le bêta de l'activité de la fiche vient d'un groupe hôtelier coté : ses capitaux propres ont un bêta de ${nombre(COMPARABLE_COTE.betaDesCapitauxPropres)}, pour un levier de ${nombre(COMPARABLE_COTE.levier)}, et il paie ${pct(x.tPct)} d'impôt. Désendettez ce bêta, à deux décimales, puis réendettez-le au levier de ${nombre(LEVIER_DE_LA_VARIANTE)} que porterait L'ESCALE après un rachat de parts payé par emprunt, et calculez le coût de ses capitaux propres à ce levier (en %).`;
      },
      champs: (c) => {
        const x = valeurDeLEscale(c);
        return [
          {
            libelle: "Bêta de l'actif du comparable, βa",
            attendu: x.betaDuComparable,
            calcul: `βa = βcp ÷ (1 + (1 − t) × D/CP) = ${nombre(COMPARABLE_COTE.betaDesCapitauxPropres)} ÷ (1 + ${nombre(1 - x.t)} × ${nombre(COMPARABLE_COTE.levier)}) = ${nombre(x.betaDuComparable)}`,
            tolerance: 0.01,
          },
          {
            libelle: `Bêta des capitaux propres au levier de ${nombre(LEVIER_DE_LA_VARIANTE)}`,
            attendu: x.betaDeLaVariante,
            calcul: `${nombre(x.betaDuComparable)} × (1 + ${nombre(1 - x.t)} × ${nombre(LEVIER_DE_LA_VARIANTE)}) = ${nombre(x.betaDeLaVariante)}`,
            tolerance: 0.01,
          },
          {
            libelle: `kcp au levier de ${nombre(LEVIER_DE_LA_VARIANTE)} (%)`,
            attendu: x.kcpDeLaVariante,
            calcul: `${pct(enPct(RISQUE_DE_L_ESCALE.tauxSansRisque))} + ${nombre(x.betaDeLaVariante)} × ${pct(enPct(RISQUE_DE_L_ESCALE.prime))} = ${pct(x.kcpDeLaVariante)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const x = valeurDeLEscale(c);
        return [
          `Désendetté, le bêta du comparable redonne ${nombre(x.betaDuComparable)}, celui de la fiche : c'est le risque de l'activité hôtelière, sans la dette. Réendetté au levier de ${nombre(LEVIER_DE_LA_VARIANTE)}, il monte à ${nombre(x.betaDeLaVariante)}, et les associés exigeraient ${pct(x.kcpDeLaVariante)} au lieu de ${pct(x.kcp)}.`,
          "On ne prend jamais le bêta des capitaux propres d'un comparable tel quel : il porte la dette du comparable. On le désendette pour trouver le risque de l'activité, puis on le réendette à la structure de l'entreprise étudiée.",
        ];
      },
    },
    {
      id: "predire-la-structure",
      type: "choix",
      titre: "Pariez sur le coût du capital",
      notions: ["enterprise_value", "loan_schedule"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        const { min, max } = LABORATOIRE_DE_LA_STRUCTURE.levier;
        return `La dette coûte ${pct(x.r.i)} après impôt, les capitaux propres ${pct(x.kcp)}. Mais plus l'hôtel s'endette, plus ses associés exigent, et plus la banque prête cher. Avant de manipuler, pariez : si ${x.entreprise} fait monter son levier de ${nombre(min)} à ${nombre(max)}, son CMPC…`;
      },
      options: (c) => {
        const x = valeurDeLEscale(c);
        const enU = x.meilleurLevier > 0 && x.meilleurLevier < LABORATOIRE_DE_LA_STRUCTURE.levier.max;
        const voir = "Faites varier la structure au laboratoire : le graphique trace le CMPC selon le levier.";
        return [
          { texte: "Baisse sans fin : la dette coûte moins que les capitaux propres", juste: !enU, retour: `${!enU ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Baisse, puis remonte : la dette finit par coûter plus cher", juste: enU, retour: `${enU ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Ne bouge pas : l'exigence des associés monte d'autant", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-structure",
      type: "simulation",
      titre: "Le laboratoire de la structure financière",
      notions: ["enterprise_value", "total_shareholder_return", "loan_schedule"],
      question: (c) => {
        const x = valeurDeLEscale(c);
        return `L'actif économique, ${eur(x.a.actifEconomique)}, et le résultat d'exploitation ne bougent pas : seul change le partage entre capitaux propres et dette. Faites varier le bêta de l'activité, la prime de risque, le levier, et la marge de crédit (la banque qui prête plus prête plus cher, 1 point de taux par unité de levier au-delà de la fiche, une hypothèse du cours). Le tableau suit les coûts et l'EVA ; le graphique, le CMPC selon le levier, avec et sans la marge.`;
      },
      leviers: (c) => {
        const x = valeurDeLEscale(c);
        const L = LABORATOIRE_DE_LA_STRUCTURE;
        const d = x.departDuLaboratoire;
        return [
          { code: "beta", libelle: "Bêta de l'activité, βa", unite: "", ...L.beta, depart: d.beta },
          { code: "prime", libelle: "Prime de risque du marché", unite: "%", ...L.prime, depart: d.prime },
          { code: "levier", libelle: "Levier financier, D/CP", unite: "", ...L.levier, depart: d.levier },
          {
            code: "marge",
            libelle: "Marge de crédit",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: d.marge,
            choix: [
              { valeur: 0, libelle: "Aucune : un taux qui ne dépend pas de la dette" },
              { valeur: 1, libelle: "1 point par unité de levier" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = valeurDeLEscale(c);
        const lab = (q: Readonly<Record<string, number>>) => laboratoireDeLaStructure(c, { beta: q.beta!, prime: q.prime!, levier: q.levier!, marge: q.marge! });
        const l = lab(p);
        const d = lab(x.departDuLaboratoire);
        return [
          { libelle: "Coût des capitaux propres, kcp", montant: enPct(l.kcp), reference: enPct(d.kcp), unite: "%" },
          { libelle: "Taux de l'emprunt, marge comprise", montant: enPct(l.tauxDeLEmprunt), reference: enPct(d.tauxDeLEmprunt), unite: "%" },
          { libelle: "Coût de l'endettement net, i", montant: enPct(l.i), reference: enPct(d.i), unite: "%" },
          { libelle: "Coût moyen pondéré du capital", montant: enPct(l.cmpc), reference: enPct(d.cmpc), unite: "%" },
          { libelle: "Rentabilité des capitaux propres", montant: enPct(l.rcp), reference: enPct(d.rcp), unite: "%" },
          { libelle: "EVA de l'année", montant: l.eva, reference: d.eva, effet: true, fort: true },
        ];
      },
      graphique: (c) => ({
        levier: "levier",
        unite: "%",
        courbes: [
          { libelle: "CMPC avec la marge de crédit", valeur: (p) => laboratoireDeLaStructure(c, { beta: p.beta!, prime: p.prime!, levier: p.levier!, marge: 1 }).cmpc * 100 },
          { libelle: "CMPC sans marge de crédit", valeur: (p) => laboratoireDeLaStructure(c, { beta: p.beta!, prime: p.prime!, levier: p.levier!, marge: 0 }).cmpc * 100 },
        ],
      }),
      defi: (c) => {
        const x = valeurDeLEscale(c);
        const { min, max, pas } = LABORATOIRE_DE_LA_STRUCTURE.levier;
        const eva = (p: Readonly<Record<string, number>>, levier: number) => laboratoireDeLaStructure(c, { beta: p.beta!, prime: p.prime!, levier, marge: p.marge! }).eva;
        const voisins = (L: number) => [auCentieme(L - pas), auCentieme(L + pas)].filter((y) => y >= min && y <= max);
        return {
          consigne: "Avec la marge de crédit, trouvez le levier qui donne la plus grande EVA, au centième de levier près.",
          atteint: (p) => p.marge === 1 && voisins(p.levier!).every((y) => eva(p, p.levier!) >= eva(p, y)),
          indice: (p) => {
            if (p.marge !== 1) return "Sans marge de crédit, la dette fait toujours baisser le CMPC : remettez la marge de crédit, puis cherchez le levier.";
            const plus = auCentieme(p.levier! + pas);
            return plus <= max && eva(p, plus) > eva(p, p.levier!)
              ? `À un levier de ${nombre(plus)}, l'EVA serait plus grande : montez le levier.`
              : "À un levier plus faible, l'EVA serait plus grande : baissez le levier.";
          },
          solution: { ...x.fiche, levier: x.meilleurLevier },
        };
      },
      explication: (c, p) => {
        const x = valeurDeLEscale(c);
        const l = laboratoireDeLaStructure(c, { beta: p.beta!, prime: p.prime!, levier: p.levier!, marge: 1 });
        const sans = laboratoireDeLaStructure(c, { beta: p.beta!, prime: p.prime!, levier: LABORATOIRE_DE_LA_STRUCTURE.levier.max, marge: 0 });
        return [
          `Au levier de ${nombre(p.levier!)}, le CMPC touche le fond du U, ${pct(enPct(l.cmpc))}, et l'EVA culmine à ${eur(l.eva)}. En deçà, la dette bon marché remplace trop peu de capitaux propres chers ; au-delà, chaque euro de dette en plus coûte plus cher à la banque et fait monter l'exigence des associés plus qu'il n'économise.`,
          `Sans la marge de crédit, la courbe ne remonte jamais : au levier de ${nombre(LABORATOIRE_DE_LA_STRUCTURE.levier.max)}, le CMPC tomberait à ${pct(enPct(sans.cmpc))}. Le fond du U ne vient que de la dette qui renchérit. Au levier de la fiche, ${nombre(x.departDuLaboratoire.levier)}, ${x.entreprise} est ${x.departDuLaboratoire.levier > x.meilleurLevier ? "au-delà" : "en deçà"} du fond, trouvé à ${nombre(x.meilleurLevier)} aux hypothèses de la fiche.`,
        ];
      },
    },
    {
      id: "modigliani-miller",
      type: "choix",
      titre: "Modigliani et Miller",
      notions: ["enterprise_value", "loan_schedule"],
      question: () =>
        "Sans marge de crédit, le laboratoire montre un CMPC qui baisse sans fin avec la dette. Modigliani et Miller en tirent, en 1963, qu'avec l'impôt la valeur de l'entreprise monte avec sa dette. Pourquoi les entreprises ne s'endettent-elles pas au maximum ?",
      options: () => [
        {
          texte: "Au-delà d'un certain levier, la dette coûte plus cher et le risque de défaillance a un coût",
          juste: true,
          retour:
            "Oui. L'économie d'impôt sur les intérêts pousse à s'endetter ; le coût d'une défaillance possible (la banque qui renchérit, les clients et les fournisseurs qui se méfient) pousse en sens inverse. C'est la théorie du compromis : le CMPC en U du laboratoire, dont le fond fixe une structure cible.",
        },
        {
          texte: "Parce que la dette coûte plus cher que les capitaux propres",
          juste: false,
          retour: "Non : chez L'ESCALE, la dette coûte bien moins que les capitaux propres, comme presque partout. C'est justement pourquoi elle fait d'abord baisser le CMPC.",
        },
        {
          texte: "Parce que l'exigence des associés monte d'autant, et que la structure ne change rien",
          juste: false,
          retour: "Non : c'est la proposition de 1958, sans impôt. Avec l'impôt, l'exigence des associés monte, mais moins que la dette n'économise : sans marge de crédit, le CMPC baisse.",
        },
        {
          texte: "Parce que l'impôt ne s'applique pas aux intérêts",
          juste: false,
          retour: "Non : les intérêts se déduisent du résultat imposable ; c'est l'économie d'impôt qui fait le coût de la dette après impôt, et la conclusion de 1963.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["enterprise_value", "profitability_vs_return"],
      texte: (c) => {
        const x = valeurDeLEscale(c);
        return [
          `Chez ${x.entreprise}, l'outil rapporte ${pct(x.r.re)} après impôt et le capital coûte ${pct(x.cmpc)} : l'année ${x.verdict === "cree" ? `crée ${eur(x.v.eva)}` : `détruit ${eur(-x.v.eva)}`} de valeur, le résultat résiduel au centime. Il faudrait ${eur(x.v.resultatDExploitationMinimal)} de résultat d'exploitation pour couvrir le coût du capital.`,
          "Être rentable ne suffit pas : il faut l'être plus que ce qu'exigent ceux qui financent l'outil. Le CMPC est le taux de référence de toute décision : un investissement, un rachat, un changement de structure créent de la valeur quand ils rapportent plus que lui sur le capital qu'ils mobilisent. La salle de séminaire l'a montré : le résultat net peut monter quand l'EVA baisse. L'endettement abaisse le CMPC tant que la dette reste bon marché, mais il fait monter l'exigence des associés, et une dette qui renchérit fait remonter le CMPC.",
          "Au niveau de l'examen, vous savez estimer le coût des capitaux propres par le MEDAF, désendetter et réendetter un bêta par Hamada, calculer le CMPC, l'EVA et le résultat résiduel, juger un investissement par l'EVA plutôt que par le résultat net, et discuter la structure financière face à Modigliani et Miller.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "CMPC = kcp × CP ÷ (CP + D) + i × D ÷ (CP + D) ; EVA = (Re − CMPC) × actif économique = résultat net − kcp × CP.",
    },
  ],
};
