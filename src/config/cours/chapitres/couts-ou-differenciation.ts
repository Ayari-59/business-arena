import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { anneeDuMarche, battreAuris, enseigneDe, gammeDe, meilleurPrix, offreDeNova, qualitePercue, strategiesGeneriques, type BilanDUneEnseigne } from "../monde/attractivite";
import { MARCHES_DU_COURS, type CodeDeGamme, type FicheDuMarche } from "../monde/marche-a-trois";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DOMINATION PAR LES COÛTS OU DIFFÉRENCIATION (Stratégie et management, palier 2 ;
 * STMG, DCG UE7, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le marché des
 * enceintes, où NOVA affronte SoundBox et Auris, a une fiche figée (monde/marche-a-trois.ts) et un
 * modèle simple (monde/attractivite.ts) : chaque trimestre, 15 502 enceintes se partagent entre les
 * trois enseignes selon leur attractivité, (59 ÷ prix) puissance 4 × qualité perçue puissance 2 ×
 * (1 + image). Une évolution du moteur ne change rien ici. Le chapitre se jouait dans plusieurs
 * marchés de l'arène ; il se joue désormais chez NOVA seule, la même PME que dans le reste du cours.
 *
 * Les deux stratégies génériques sont des offres de la fiche, tenues toute l'année : la domination
 * par les coûts (la gamme standard, 54 €, le budget qualité coupé de moitié), le milieu (NOVA
 * aujourd'hui) et la différenciation (la gamme soignée, 69 €, le budget qualité doublé et un peu de
 * communication). L'élève en tire la part de marché, la marge par enceinte, le coût complet, le
 * seuil de rentabilité et le résultat ; il voit le milieu coincé (ni le volume de l'une, ni la marge
 * de l'autre) et dernier ; puis il cherche, au laboratoire, l'offre qui bat Auris.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, volume, marge, resultat (la formule est dans la question, qui nomme les
 *     chiffres ; resultat fait calculer le coût complet des trois stratégies, défaut de l'audit) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-seuil
 *     puis le-seuil-au-curseur (les ventes où la différenciation devient rentable) avant resultat ;
 *     predire-le-rattrapage puis le-volume-au-curseur (les ventes qu'il faudrait à la stratégie de
 *     coûts pour égaler la différenciation) avant ce-qu-il-faudrait-vendre ; predire-auris puis
 *     le-laboratoire-de-l-offre (prix, gamme, budget qualité, communication : battre Auris) avant
 *     battre-auris-a-la-main ;
 *   · autonome : ecarts-au-milieu, laquelle, milieu, ce-qu-il-faudrait-vendre (ni formule ni
 *     chiffres donnés ; le calcul de la correction montre le chemin) ;
 *   · expert : a-rebours (le coût variable qu'il faudrait au milieu pour égaler la différenciation),
 *     le-laboratoire-de-l-offre, battre-auris-a-la-main (une variante chiffrée : l'année refaite à la
 *     main, la gamme soignée à 67 €, avec le résultat d'Auris la même année), les-limites (une
 *     critique de la méthode : le classement dépend des hypothèses) ; puis la synthèse.
 */

/**
 * LES STRATÉGIES DE LA MISSION JOUÉE DANS L'ARÈNE (jouez.ts) : des multiplicateurs de la décision du
 * joueur, chaque tour (le prix baisse de 10 % ou monte de 15 %). Le chapitre, lui, raisonne sur les
 * offres de la fiche du monde du cours (monde/marche-a-trois.ts, `STRATEGIES`).
 */
export interface Leviers {
  prix: number;
  qualite: number;
  marketing: number;
  production: number;
}

/** @deprecated Pour la seule mission « jouez » de l'arène (son `prix`) : le chapitre lit les offres de la fiche du monde du cours. */
export const STRATEGIE_DE_COUTS: Leviers = { prix: 0.9, qualite: 0.5, marketing: 0.5, production: 1.4 };

/** @deprecated Pour la seule mission « jouez » de l'arène (son `prix`) : le chapitre lit les offres de la fiche du monde du cours. */
export const STRATEGIE_DE_DIFFERENCIATION: Leviers = { prix: 1.15, qualite: 2, marketing: 1.5, production: 1 };

/** Le marché à trois enseignes se joue chez NOVA, face à SoundBox et Auris. */
export const ENTREPRISES_DU_MARCHE_A_TROIS: readonly string[] = ["nova"];

/** Ce que l'on dit à l'élève qui arrive d'une autre entreprise. */
export const POURQUOI_LE_MARCHE_A_TROIS =
  "ce chapitre se joue sur le marché des enceintes de la simulation du cours, où NOVA, la PME du reste du cours, affronte deux concurrents que la simulation fait jouer, SoundBox et Auris.";

/** Les bornes du curseur du seuil : les ventes de l'année avec la différenciation. */
export const VENTES_DU_CURSEUR_DU_SEUIL = { min: 10_000, max: 24_000 } as const;

/** Les bornes du curseur du rattrapage : les ventes de l'année avec la stratégie de coûts. */
export const VENTES_DU_CURSEUR_DU_RATTRAPAGE = { min: 20_000, max: 28_000 } as const;

/** Le laboratoire : le prix de vente (au pas d'un euro) et les budgets par trimestre (au pas de 1 000 €). */
export const PRIX_DU_LABORATOIRE = { min: 50, max: 80, pas: 1 } as const;
export const BUDGET_DU_LABORATOIRE = { min: 0, max: 16_000, pas: 1_000 } as const;

/** La gamme du laboratoire est un levier à choix : la valeur 0, 1 ou 2 désigne la gamme standard, actuelle ou soignée. */
export const GAMMES_DU_LABORATOIRE: readonly CodeDeGamme[] = ["standard", "actuelle", "soignee"];

/**
 * LA VARIANTE DE L'EXPERT, hypothèse du cours : la gamme soignée vendue 65 € (67 € avant la réconciliation du marché), avec les budgets
 * d'aujourd'hui (4 000 € de qualité par trimestre, pas de communication). C'est l'offre qui bat Auris
 * avec le meilleur résultat de NOVA ; l'élève refait l'année à la main.
 */
export const VARIANTE_DE_L_EXPERT: { gamme: CodeDeGamme; prix: number } = { gamme: "soignee", prix: 65 };

/**
 * LA CRITIQUE, hypothèse du cours : des clients moins sensibles à la qualité, l'attractivité variant
 * comme la qualité perçue puissance 1 au lieu de 2. Le classement des stratégies s'en trouve renversé.
 */
export const ELASTICITE_A_LA_QUALITE_DE_LA_CRITIQUE = 1;

/** L'explication du laboratoire compare le meilleur prix de la gamme soignée à un prix plus bas de 3 € : l'avance sur Auris grandit, le résultat baisse. */
export const BAISSE_DE_L_EXPLICATION = 3;

/** Un prix d'une offre à essayer, au pari d'Auris : la différenciation du chapitre, vendue plus cher encore. */
export const PRIX_DE_LA_DIFFERENCIATION_PLUS_CHERE = 75;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Une part (une fraction) en pourcentage au centième. */
const pct = (x: number) => `${qte(Math.round(x * 10_000) / 100)} %`;
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;
const auCentime = auCentieme;
/** Un nombre au nombre de décimales donné, à la française (une qualité, une attractivité). */
const dec = (x: number, n = 2) => x.toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });
const signe = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
/** « de NOVA », « d'Auris » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La fiche du marché à trois. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDuMarche => MARCHES_DU_COURS[c.code]!;

export type CodeDeStrategie = "couts" | "milieu" | "differenciation";

export const NOMS_DES_STRATEGIES: Record<CodeDeStrategie, string> = {
  couts: "la domination par les coûts",
  milieu: "le milieu",
  differenciation: "la différenciation",
};

/** L'année de NOVA à une position du laboratoire : prix, gamme (0, 1 ou 2), budget qualité, communication. */
export function laboratoireDeLOffre(f: FicheDuMarche, p: Readonly<Record<string, number>>) {
  const nova = { prix: p.prix!, gamme: GAMMES_DU_LABORATOIRE[p.gamme!]!, budgetQualite: p.qualite!, budgetCommunication: p.communication! };
  const b = battreAuris(f, { nova });
  return { nova: b.nova, auris: b.auris, ecart: b.ecart, battue: b.battue };
}

function calculer(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = strategiesGeneriques(f);
  const { couts, milieu, differenciation } = s;
  const trois: readonly { code: CodeDeStrategie; bilan: BilanDUneEnseigne }[] = [
    { code: "couts", bilan: couts },
    { code: "milieu", bilan: milieu },
    { code: "differenciation", bilan: differenciation },
  ];
  const strategie = (code: CodeDeStrategie) => f.strategies.find((x) => x.code === code)!;
  const offres = trois.map((x) => {
    const st = strategie(x.code);
    const g = gammeDe(f, st.gamme);
    return { code: x.code, gamme: g, strategie: st, qualite: qualitePercue(f, offreDeNova(f, { gamme: st.gamme, budgetQualite: st.budgetQualite })) };
  });
  const auris = enseigneDe(f, "auris");
  const soundbox = enseigneDe(f, "soundbox");
  // Le rattrapage : les ventes qu'il faudrait à la stratégie de coûts pour égaler la différenciation.
  const ventesPourEgaler = s.ventesDesCoutsPourEgalerLaDifferenciation;
  // Le calcul à rebours : la marge par enceinte qu'il faudrait au milieu, à ses ventes, pour égaler la
  // différenciation ; le coût variable le plus haut qui la donne, au prix d'aujourd'hui.
  const margeNecessaire = auCentime((differenciation.resultat + milieu.charges) / milieu.ventes);
  const coutVariableMaximal = auCentime(milieu.offre.prix - margeNecessaire);
  const baisseDuCoutVariable = auCentime(milieu.coutVariable - coutVariableMaximal);
  // La gamme standard au prix d'aujourd'hui, les budgets d'aujourd'hui : 4 € de moins, mais moins de qualité.
  const standardAuPrixDuMilieu = anneeDuMarche(f, { nova: { gamme: "standard" } }).nova;
  // La variante de l'expert : la gamme soignée à 67 €, les budgets d'aujourd'hui.
  const v = anneeDuMarche(f, { nova: VARIANTE_DE_L_EXPERT });
  const [aNova, aSoundbox, aAuris] = v.trimestres[0]!.map((x) => x.attractivite) as [number, number, number];
  const variante = {
    annee: v,
    nova: v.nova,
    auris: v.auris,
    attractiviteNova: aNova,
    attractiviteSoundbox: aSoundbox,
    attractiviteAuris: aAuris,
    sommeDesAttractivites: aNova + aSoundbox + aAuris,
    partDuTrimestre: auCentieme(v.nova.trimestres[0]!.part * 100),
    ventesDuTrimestre: v.nova.trimestres[0]!.ventes,
    ventesDAurisDuTrimestre: v.auris.trimestres[0]!.ventes,
    ecart: auCentime(v.nova.resultat - v.auris.resultat),
  };
  // Le laboratoire : battre Auris n'est pas gagner le plus. La gamme soignée, aux budgets d'aujourd'hui,
  // sur toute la course du prix ; et le meilleur que donne la gamme standard.
  const soignee = (prix: number) => battreAuris(f, { nova: { gamme: "soignee", prix } });
  const prixDuLabo = Array.from({ length: (PRIX_DU_LABORATOIRE.max - PRIX_DU_LABORATOIRE.min) / PRIX_DU_LABORATOIRE.pas + 1 }, (_, i) => PRIX_DU_LABORATOIRE.min + i * PRIX_DU_LABORATOIRE.pas);
  const soigneeQuiBat = prixDuLabo.filter((p) => soignee(p).battue);
  const meilleurSoigne = meilleurPrix(f, { nova: { gamme: "soignee" } }, PRIX_DU_LABORATOIRE);
  // Sur la course du laboratoire (au pas d'un euro), avec les budgets d'aujourd'hui : les meilleurs de la gamme standard.
  const meilleurStandard = meilleurPrix(f, { nova: { gamme: "standard" } }, PRIX_DU_LABORATOIRE);
  const meilleurActuel = meilleurPrix(f, {}, { min: 40, max: 80, pas: 0.5 });
  const plusBas = meilleurSoigne.prix - BAISSE_DE_L_EXPLICATION;
  // Le pari d'Auris : trois offres, une seule bat Auris.
  const paris = {
    actuelle: battreAuris(f, { nova: { prix: meilleurActuel.prix } }),
    soignee: soignee(VARIANTE_DE_L_EXPERT.prix),
    plusChere: battreAuris(f, { nova: { gamme: "soignee", prix: PRIX_DE_LA_DIFFERENCIATION_PLUS_CHERE, budgetQualite: strategie("differenciation").budgetQualite, budgetCommunication: strategie("differenciation").budgetCommunication } }),
  };
  // La critique : des clients moins sensibles à la qualité.
  const critique = strategiesGeneriques({ ...f, attractivite: { ...f.attractivite, elasticiteALaQualite: ELASTICITE_A_LA_QUALITE_DE_LA_CRITIQUE } });
  return {
    f,
    s,
    couts,
    milieu,
    differenciation,
    trois,
    offres,
    auris,
    soundbox,
    meilleure: s.meilleure,
    rangDuMilieu: s.rangDuMilieu,
    coince: s.coince,
    ecartCouts: s.ecartCouts,
    ecartDifferenciation: s.ecartDifferenciation,
    ecartEntreLesDeux: auCentime(differenciation.resultat - couts.resultat),
    ventesPourEgaler,
    enceintesDePlus: ventesPourEgaler - couts.ventes,
    partPourEgaler: ventesPourEgaler / s.annees.couts.marche,
    margeNecessaire,
    coutVariableMaximal,
    baisseDuCoutVariable,
    standardAuPrixDuMilieu,
    variante,
    aurisDansLAnnee: { couts: s.annees.couts.auris.resultat, milieu: s.annees.milieu.auris.resultat, differenciation: s.annees.differenciation.auris.resultat },
    soundboxDansLAnnee: { couts: s.annees.couts.soundbox.resultat, milieu: s.annees.milieu.soundbox.resultat, differenciation: s.annees.differenciation.soundbox.resultat },
    soigneeQuiBat,
    meilleurSoigne,
    meilleurStandard,
    meilleurActuel,
    plusBas: { prix: plusBas, bilan: soignee(plusBas) },
    paris,
    critique,
  };
}

const memo = new Map<string, ReturnType<typeof calculer>>();

/** Les trois stratégies, et tout ce que le chapitre et son cas en tirent. */
export function coutsOuDifferenciation(c: Pick<Cas, "code">) {
  const deja = memo.get(c.code);
  if (deja) return deja;
  const x = calculer(c);
  memo.set(c.code, x);
  return x;
}

export type CoutsOuDifferenciation = ReturnType<typeof coutsOuDifferenciation>;

const COLONNES = ["Domination par les coûts", "Au milieu", "Différenciation"];

/** Ce que chaque stratégie met sur le marché, chaque trimestre : le document de départ. */
function tableauDesOffres(c: Pick<Cas, "code">): TableauDeDonnees {
  const k = coutsOuDifferenciation(c);
  return {
    titre: `Ce que chaque stratégie ${dE(k.f.entreprise)} met sur le marché, chaque trimestre`,
    colonnes: COLONNES,
    lignes: [
      { libelle: "Gamme", valeurs: k.offres.map((o) => o.gamme.nom.replace(/^la /, "")) },
      { libelle: "Coût variable d'une enceinte", valeurs: k.offres.map((o) => eur(o.gamme.composants + o.gamme.autres)) },
      { libelle: "Qualité de conception de la gamme", valeurs: k.offres.map((o) => dec(o.gamme.qualiteDeConception)) },
      { libelle: "Prix de vente", valeurs: k.offres.map((o) => eur(o.strategie.prix)) },
      { libelle: "Budget qualité par trimestre", valeurs: k.offres.map((o) => eur(o.strategie.budgetQualite)) },
      { libelle: "Qualité perçue", valeurs: k.offres.map((o) => dec(o.qualite)) },
      { libelle: "Communication par trimestre", valeurs: k.offres.map((o) => eur(o.strategie.budgetCommunication)) },
    ],
  };
}

/** Le bilan des trois stratégies, pour la synthèse. */
function tableauDuBilan(c: Pick<Cas, "code">): TableauDeDonnees {
  const k = coutsOuDifferenciation(c);
  const b = k.trois.map((x) => x.bilan);
  return {
    titre: "Les trois stratégies, tenues toute l'année",
    colonnes: COLONNES,
    lignes: [
      { libelle: `Ventes de l'année (${k.f.unites})`, valeurs: b.map((x) => qte(x.ventes)) },
      { libelle: "Part de marché", valeurs: b.map((x) => pct(x.part)) },
      { libelle: "Marge par enceinte", valeurs: b.map((x) => eur(x.margeUnitaire)) },
      { libelle: "Coût complet d'une enceinte vendue", valeurs: b.map((x) => eur(x.coutComplet)) },
      { libelle: `Seuil de rentabilité (${k.f.unites})`, valeurs: b.map((x) => qte(x.seuilDeRentabilite)) },
      { libelle: "Résultat de l'année", valeurs: b.map((x) => eur(x.resultat)) },
    ],
  };
}

/** Le rang du milieu, en mots. */
const rangEcrit = (r: "premier" | "entre" | "dernier") => (r === "dernier" ? "dernier des trois" : r === "premier" ? "premier des trois" : "entre les deux stratégies");

export const COUTS_OU_DIFFERENCIATION: Chapitre = {
  code: "couts-ou-differenciation",
  parcours: "strategie",
  palier: 2,
  blocs: [
    "STMG Thème 3 · Les choix stratégiques des organisations",
    "DCG UE7 · Management des organisations",
    "BUT GEA · Concevoir la stratégie de création de valeur",
  ],
  titre: "Domination par les coûts ou différenciation",
  accroche:
    "Vendre moins cher que tous, ou plus cher parce qu'on est meilleur : les deux stratégies génériques, tenues toute une année dans la simulation du cours, face aux mêmes concurrents. Ce que chacune vend, gagne et coûte par enceinte, pourquoi rester au milieu coûte le plus, et l'offre qui bat le haut de gamme.",
  objectifs: [
    "Distinguer la domination par les coûts et la différenciation",
    "Comparer des stratégies par la part de marché, la marge par enceinte, le coût complet et le seuil de rentabilité",
    "Expliquer pourquoi rester au milieu peut être le pire",
    "Retrouver à rebours le coût ou le volume qu'une stratégie demanderait",
    "Critiquer un classement de stratégies par ses hypothèses",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_MARCHE_A_TROIS, pourquoi: POURQUOI_LE_MARCHE_A_TROIS },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux stratégies pour un même marché",
      notions: ["demand_market_share", "full_unit_cost"],
      tableau: tableauDesOffres,
      texte: (c) => {
        const k = coutsOuDifferenciation(c);
        const f = k.f;
        const a = f.attractivite;
        return [
          "Face à ses concurrents, une entreprise peut chercher à vendre moins cher que les autres, parce que ses coûts sont les plus bas : c'est la domination par les coûts. Elle peut aussi vendre plus cher, parce que ses clients lui reconnaissent quelque chose de plus, ici la qualité : c'est la différenciation.",
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, sur une année type : l'année de la simulation du cours, faite de trimestres égaux, qui n'est ni l'année N ni l'année N + 1 des autres chapitres. Chaque trimestre, les clients achètent ${qte(f.marche.parTrimestre)} ${f.unites} aux trois enseignes du marché, ${f.entreprise}, ${k.soundbox.nom} et ${k.auris.nom}. Le marché ne grandit pas : ce qu'une enseigne gagne, elle le prend aux deux autres.`,
          `Chaque enseigne prend une part du marché égale à son attractivité rapportée à la somme des trois : attractivité = (${eur(a.prixDeReference)} ÷ prix) puissance ${a.elasticiteAuPrix} × qualité perçue puissance ${a.elasticiteALaQualite} × (1 + image). Le prix compte double de la qualité. La qualité perçue vient surtout de la gamme, un peu du budget qualité ; l'image vient de la communication.`,
          `${k.soundbox.nom} vend à ${eur(k.soundbox.offre.prix)} une enceinte fabriquée en très grandes séries ; ${k.auris.nom} vend ${eur(k.auris.offre.prix)} une enceinte haut de gamme. Les concurrents ne réagissent pas : leurs offres sont tenues toute l'année. Les charges fixes ${dE(f.entreprise)} sont celles de janvier, ${eur(k.milieu.chargesFixes / 12)} par mois, sur l'année : ${eur(k.milieu.chargesFixes)} ; les budgets sont des charges du trimestre, et le résultat est avant impôt.`,
          `La simulation du cours joue l'année avec chaque stratégie, tenue tous les trimestres. Le tableau dit ce que chacune met sur le marché : la gamme, son coût variable et sa qualité, le prix et les budgets. Le milieu, c'est ${f.entreprise} aujourd'hui.`,
        ];
      },
      repere: () =>
        "Domination par les coûts : les coûts les plus bas du marché, pour vendre moins cher et en grand volume. Différenciation : une offre que les clients jugent meilleure, pour la vendre plus cher.",
    },
    {
      id: "volume",
      type: "montants",
      titre: "Ce que chaque stratégie vend",
      notions: ["demand_market_share", "price_elasticity"],
      tableau: (c) => {
        const k = coutsOuDifferenciation(c);
        return {
          titre: "L'année jouée avec chaque stratégie : les ventes",
          colonnes: COLONNES,
          lignes: [
            { libelle: "Prix de vente", valeurs: k.trois.map((x) => eur(x.bilan.offre.prix)) },
            { libelle: "Qualité perçue", valeurs: k.trois.map((x) => dec(x.bilan.qualite)) },
            { libelle: `Ventes de l'année (${k.f.unites})`, valeurs: k.trois.map((x) => qte(x.bilan.ventes)) },
            { libelle: `Marché de l'année (${k.f.unites})`, valeurs: k.trois.map(() => qte(k.s.annees.milieu.marche)) },
            { libelle: "Part de marché", valeurs: ["à calculer", pct(k.milieu.part), "à calculer"] },
          ],
        };
      },
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `Le marché de l'année est de ${qte(k.s.annees.milieu.marche)} ${k.f.unites}, le même avec chaque stratégie. Calculez la part de marché ${dE(k.f.entreprise)} avec la domination par les coûts, puis avec la différenciation : ventes ÷ marché × 100, en pourcentage au centième.`;
      },
      champs: (c) => {
        const k = coutsOuDifferenciation(c);
        const m = k.s.annees.milieu.marche;
        return [
          { libelle: "Part de marché, domination par les coûts (%)", attendu: auCentieme(k.couts.part * 100), calcul: `${qte(k.couts.ventes)} ÷ ${qte(m)} × 100 = ${pct(k.couts.part)}` },
          { libelle: "Part de marché, différenciation (%)", attendu: auCentieme(k.differenciation.part * 100), calcul: `${qte(k.differenciation.ventes)} ÷ ${qte(m)} × 100 = ${pct(k.differenciation.part)}` },
        ];
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          `Face au milieu (${pct(k.milieu.part)}), la domination par les coûts prend ${pct(k.couts.part)} du marché, la différenciation ${pct(k.differenciation.part)}. Le prix bas attire des clients malgré une qualité un peu plus basse ; le prix haut en fait partir, que la gamme soignée ne retient pas tous.`,
          "La part de marché dit combien l'entreprise vend, pas ce que chaque vente lui rapporte : c'est la marge qui le dit.",
        ];
      },
    },
    {
      id: "marge",
      type: "montants",
      titre: "Ce que chaque vente rapporte",
      notions: ["contribution_margin", "margin_rates"],
      tableau: (c) => {
        const k = coutsOuDifferenciation(c);
        return {
          titre: "L'année jouée avec chaque stratégie : la marge",
          colonnes: COLONNES,
          lignes: [
            { libelle: "Prix de vente", valeurs: k.trois.map((x) => eur(x.bilan.offre.prix)) },
            { libelle: "Coût variable d'une enceinte", valeurs: k.trois.map((x) => eur(x.bilan.coutVariable)) },
            { libelle: `Ventes de l'année (${k.f.unites})`, valeurs: k.trois.map((x) => qte(x.bilan.ventes)) },
            { libelle: "Marge par enceinte", valeurs: ["à calculer", eur(k.milieu.margeUnitaire), "à calculer"] },
            { libelle: "Marge sur coût variable de l'année", valeurs: ["à calculer", eur(k.milieu.marge), "à calculer"] },
          ],
        };
      },
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `La marge par enceinte est ce qui reste du prix une fois payé le coût variable de la gamme : prix − coût variable. Calculez-la avec la domination par les coûts et avec la différenciation, puis la marge sur coût variable de l'année de chacune : marge par enceinte × ventes (au milieu : ${eur(k.milieu.margeUnitaire)} × ${qte(k.milieu.ventes)} = ${eur(k.milieu.marge)}).`;
      },
      champs: (c) => {
        const k = coutsOuDifferenciation(c);
        const { couts: a, differenciation: b } = k;
        return [
          { libelle: "Marge par enceinte, domination par les coûts", attendu: a.margeUnitaire, calcul: `${eur(a.offre.prix)} − ${eur(a.coutVariable)} = ${eur(a.margeUnitaire)}` },
          { libelle: "Marge par enceinte, différenciation", attendu: b.margeUnitaire, calcul: `${eur(b.offre.prix)} − ${eur(b.coutVariable)} = ${eur(b.margeUnitaire)}` },
          { libelle: "Marge sur coût variable de l'année, domination par les coûts", attendu: a.marge, calcul: `${eur(a.margeUnitaire)} × ${qte(a.ventes)} = ${eur(a.marge)}` },
          { libelle: "Marge sur coût variable de l'année, différenciation", attendu: b.marge, calcul: `${eur(b.margeUnitaire)} × ${qte(b.ventes)} = ${eur(b.marge)}` },
        ];
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        const taux = (b: BilanDUneEnseigne) => pct(b.tauxDeMarge);
        return [
          `Une enceinte vendue laisse ${eur(k.couts.margeUnitaire)} avec la domination par les coûts, ${eur(k.milieu.margeUnitaire)} au milieu et ${eur(k.differenciation.margeUnitaire)} avec la différenciation. La stratégie de coûts baisse son prix de ${eur(k.milieu.offre.prix - k.couts.offre.prix)}, mais sa gamme coûte ${eur(k.milieu.coutVariable - k.couts.coutVariable)} de moins : elle ne perd que ${eur(k.milieu.margeUnitaire - k.couts.margeUnitaire)} par enceinte. C'est ce qui distingue une stratégie de coûts d'une simple baisse de prix.`,
          `Rapportée au prix, la marge fait ${taux(k.couts)} avec les coûts, ${taux(k.milieu)} au milieu et ${taux(k.differenciation)} avec la différenciation : le milieu a le plus petit taux de marge des trois. Reste à savoir laquelle paie le mieux les charges de l'année.`,
        ];
      },
    },
    {
      id: "predire-le-seuil",
      type: "choix",
      titre: "Pariez sur le seuil de rentabilité",
      notions: ["breakeven", "contribution_margin"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `Avant de calculer, pariez. La différenciation vend ${qte(k.differenciation.ventes)} ${k.f.unites}, la stratégie de coûts ${qte(k.couts.ventes)}, le milieu ${qte(k.milieu.ventes)}. Laquelle des trois couvre ses charges de l'année avec le moins de ventes ?`;
      },
      options: (c) => {
        const k = coutsOuDifferenciation(c);
        const voir = "Faites varier les ventes à l'étape suivante : le curseur montre où la marge couvre les charges.";
        const plusBas = [...k.trois].sort((a, b) => a.bilan.seuilDeRentabilite - b.bilan.seuilDeRentabilite)[0]!.code;
        const textes: Record<CodeDeStrategie, string> = { differenciation: "La différenciation", couts: "La domination par les coûts", milieu: "Le milieu" };
        return (["differenciation", "couts", "milieu"] as const).map((code) => ({
          texte: textes[code],
          juste: code === plusBas,
          retour: `${code === plusBas ? "Bon pari." : "Pari à vérifier."} ${voir}`,
        }));
      },
    },
    {
      id: "le-seuil-au-curseur",
      type: "curseur",
      titre: "Le seuil de la différenciation",
      notions: ["breakeven", "contribution_margin"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        const d = k.differenciation;
        return `Faites varier les ventes de l'année avec la différenciation, de ${qte(VENTES_DU_CURSEUR_DU_SEUIL.min)} à ${qte(VENTES_DU_CURSEUR_DU_SEUIL.max)} ${k.f.unites}. Une droite donne la marge sur coût variable (${eur(d.margeUnitaire)} par enceinte), l'autre les charges de l'année, fixes et budgets (${eur(d.charges)}). Placez le curseur sur le plus petit nombre de ventes où la marge couvre les charges, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Ventes de l'année, avec la différenciation", unite: coutsOuDifferenciation(c).f.unites }),
      cible: (c) => {
        const d = coutsOuDifferenciation(c).differenciation;
        return { attendu: Math.ceil(d.charges / d.margeUnitaire - 1e-9), min: VENTES_DU_CURSEUR_DU_SEUIL.min, max: VENTES_DU_CURSEUR_DU_SEUIL.max };
      },
      zones: ["Au-dessus du seuil : un bénéfice", "Sous le seuil : une perte"],
      rates: () => ({
        dessous: "À cette position, la marge ne couvre pas encore les charges de l'année : la différenciation perd de l'argent.",
        dessus: "Plus bas, la marge couvre encore les charges : cherchez le plus petit nombre de ventes.",
      }),
      lecture: (c, q) => {
        const d = coutsOuDifferenciation(c).differenciation;
        return [
          { libelle: "Marge sur coût variable", montant: auCentime(d.margeUnitaire * q) },
          { libelle: "Charges fixes et budgets de l'année", montant: d.charges },
          { libelle: "Coût complet d'une enceinte vendue", montant: auCentime(d.coutVariable + d.charges / q) },
          { libelle: "Résultat de l'année", montant: auCentime(d.margeUnitaire * q - d.charges), fort: true },
        ];
      },
      droites: (c) => {
        const d = coutsOuDifferenciation(c).differenciation;
        return { produit: (q) => d.margeUnitaire * q, cout: () => d.charges, libelles: ["Marge sur coût variable", "Charges fixes et budgets"] };
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        const d = k.differenciation;
        return [
          `La différenciation couvre ses charges dès ${qte(d.seuilDeRentabilite)} ${k.f.unites} : là, une enceinte coûte tout compris son prix, ${eur(d.offre.prix)}. Elle en vend ${qte(d.ventes)}, soit ${qte(d.ventes - d.seuilDeRentabilite)} de plus que son seuil.`,
          `Ses charges sont les plus lourdes (${eur(d.charges)}), mais chaque enceinte en paie ${eur(d.margeUnitaire)}. La stratégie de coûts, à ${eur(k.couts.margeUnitaire)} par enceinte, a besoin de ${qte(k.couts.seuilDeRentabilite)} ventes ; le milieu, de ${qte(k.milieu.seuilDeRentabilite)}. Le seuil se calcule à l'étape suivante, avec le coût complet.`,
        ];
      },
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Le coût complet d'une enceinte",
      notions: ["full_unit_cost", "breakeven"],
      tableau: (c) => {
        const k = coutsOuDifferenciation(c);
        return {
          titre: "L'année jouée avec chaque stratégie : les coûts",
          colonnes: COLONNES,
          lignes: [
            { libelle: `Ventes de l'année (${k.f.unites})`, valeurs: k.trois.map((x) => qte(x.bilan.ventes)) },
            { libelle: "Coût variable d'une enceinte", valeurs: k.trois.map((x) => eur(x.bilan.coutVariable)) },
            { libelle: "Charges fixes de l'année", valeurs: k.trois.map((x) => eur(x.bilan.chargesFixes)) },
            { libelle: "Budgets qualité et communication de l'année", valeurs: k.trois.map((x) => eur(x.bilan.budgets)) },
            { libelle: "Charges fixes et budgets", valeurs: k.trois.map((x) => eur(x.bilan.charges)) },
            { libelle: "Coût complet d'une enceinte vendue", valeurs: k.trois.map(() => "à calculer") },
          ],
        };
      },
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `Le coût complet d'une enceinte vendue compte toutes les charges de l'année, réparties sur les ventes : coût variable + (charges fixes + budgets) ÷ ventes. Calculez-le pour chaque stratégie, au centime. Puis le seuil de rentabilité de la domination par les coûts : (charges fixes + budgets) ÷ marge par enceinte (${eur(k.couts.margeUnitaire)}), à l'enceinte supérieure.`;
      },
      champs: (c) => {
        const k = coutsOuDifferenciation(c);
        const cc = (b: BilanDUneEnseigne) => `${eur(b.coutVariable)} + ${eur(b.charges)} ÷ ${qte(b.ventes)} = ${eur(b.coutComplet)}`;
        return [
          { libelle: "Coût complet, domination par les coûts", attendu: k.couts.coutComplet, calcul: cc(k.couts) },
          { libelle: "Coût complet, milieu", attendu: k.milieu.coutComplet, calcul: cc(k.milieu) },
          { libelle: "Coût complet, différenciation", attendu: k.differenciation.coutComplet, calcul: cc(k.differenciation) },
          {
            libelle: "Seuil de rentabilité, domination par les coûts",
            attendu: k.couts.seuilDeRentabilite,
            calcul: `${eur(k.couts.charges)} ÷ ${eur(k.couts.margeUnitaire)} = ${qte(auCentieme(k.couts.charges / k.couts.margeUnitaire))}, arrondi à ${qte(k.couts.seuilDeRentabilite)} ${k.f.unites}`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          `La domination par les coûts porte bien son nom : une enceinte y coûte ${eur(k.couts.coutComplet)} tout compris, contre ${eur(k.milieu.coutComplet)} au milieu et ${eur(k.differenciation.coutComplet)} avec la différenciation. Sa gamme coûte moins, ses budgets sont coupés, et ses charges fixes se répartissent sur plus de ventes.`,
          `Le coût complet ne dit pas seul ce que l'enceinte rapporte : il faut le comparer au prix. Une fois tout payé, une enceinte laisse ${eur(auCentime(k.couts.offre.prix - k.couts.coutComplet))} avec les coûts, ${eur(auCentime(k.milieu.offre.prix - k.milieu.coutComplet))} au milieu et ${eur(auCentime(k.differenciation.offre.prix - k.differenciation.coutComplet))} avec la différenciation. Le seuil de la stratégie de coûts, ${qte(k.couts.seuilDeRentabilite)} ${k.f.unites}, est plus haut que celui de la différenciation (${qte(k.differenciation.seuilDeRentabilite)}) : chaque enceinte y paie moins de charges.`,
        ];
      },
    },
    {
      id: "ecarts-au-milieu",
      type: "montants",
      titre: "Le résultat de l'année",
      notions: ["income_statement", "contribution_margin"],
      tableau: (c) => {
        const k = coutsOuDifferenciation(c);
        return {
          titre: "L'année jouée avec chaque stratégie : le résultat",
          colonnes: COLONNES,
          lignes: [
            { libelle: "Marge sur coût variable de l'année", valeurs: k.trois.map((x) => eur(x.bilan.marge)) },
            { libelle: "Charges fixes et budgets", valeurs: k.trois.map((x) => eur(x.bilan.charges)) },
            { libelle: "Résultat de l'année", valeurs: ["à calculer", eur(k.milieu.resultat), "à calculer"] },
          ],
        };
      },
      question: () =>
        "Sans formule cette fois. Calculez le résultat de l'année avec la domination par les coûts et avec la différenciation, puis l'écart de chacune avec le milieu. Négatif pour un écart défavorable.",
      champs: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          { libelle: "Résultat, domination par les coûts", attendu: k.couts.resultat, calcul: `${eur(k.couts.marge)} − ${eur(k.couts.charges)} = ${eur(k.couts.resultat)}` },
          { libelle: "Résultat, différenciation", attendu: k.differenciation.resultat, calcul: `${eur(k.differenciation.marge)} − ${eur(k.differenciation.charges)} = ${eur(k.differenciation.resultat)}` },
          { libelle: "Écart, domination par les coûts moins milieu", attendu: k.ecartCouts, calcul: `${eur(k.couts.resultat)} − ${entre(k.milieu.resultat)} = ${eur(k.ecartCouts)}` },
          { libelle: "Écart, différenciation moins milieu", attendu: k.ecartDifferenciation, calcul: `${eur(k.differenciation.resultat)} − ${entre(k.milieu.resultat)} = ${eur(k.ecartDifferenciation)}` },
        ];
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        const d = k.differenciation;
        return [
          `Sur l'année, la domination par les coûts fait ${signe(k.ecartCouts)} de résultat face au milieu, la différenciation ${signe(k.ecartDifferenciation)}. Les deux stratégies battent le milieu, chacune par son côté.`,
          `La différenciation gagne malgré moins de ventes : ses ${eur(d.margeUnitaire - k.milieu.margeUnitaire)} de marge en plus par enceinte, sur ${qte(d.ventes)} ventes, paient largement ses ${eur(d.budgets - k.milieu.budgets)} de budgets en plus.`,
        ];
      },
    },
    {
      id: "laquelle",
      type: "choix",
      titre: "Quelle stratégie retenir ?",
      notions: ["demand_market_share", "contribution_margin"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `Face à ${k.soundbox.nom} et à ${k.auris.nom}, quelle stratégie donne à ${k.f.entreprise} le meilleur résultat de l'année ?`;
      },
      options: (c) => {
        const k = coutsOuDifferenciation(c);
        const m = k.meilleure;
        const resultats = `${eur(k.couts.resultat)} avec la domination par les coûts, ${eur(k.milieu.resultat)} au milieu, ${eur(k.differenciation.resultat)} avec la différenciation`;
        const oui: Record<CodeDeStrategie, string> = {
          differenciation: `Oui : ${resultats}. Chaque enceinte laisse ${eur(k.differenciation.margeUnitaire)} de marge, contre ${eur(k.milieu.margeUnitaire)} au milieu : ${k.f.entreprise} vend moins, mais gagne plus sur chaque vente. ${k.auris.nom} reste plus chère (${eur(k.auris.offre.prix)}) : ${k.f.entreprise} se différencie sans aller jusqu'au prix du haut de gamme.`,
          couts: `Oui : ${resultats}. Les ventes en plus paient la marge perdue sur chaque enceinte.`,
          milieu: `Oui : ${resultats}. Ici, aucune des deux stratégies ne paie ce qu'elle change.`,
        };
        const options: { code: CodeDeStrategie; texte: string; erreur: string }[] = [
          { code: "differenciation", texte: "La différenciation", erreur: "" },
          { code: "couts", texte: `La domination par les coûts, qui prend ${pct(k.couts.part)} du marché`, erreur: "la plus grande part de marché ne fait pas le meilleur résultat" },
          { code: "milieu", texte: "Le milieu, qui n'engage aucun budget en plus", erreur: "économiser des budgets ne paie pas une marge et un volume moyens" },
        ];
        return options.map((o) => ({
          texte: o.texte,
          juste: o.code === m.code,
          retour: o.code === m.code ? oui[o.code] : `Non : ${resultats}. ${o.erreur ? `${o.erreur.charAt(0).toUpperCase()}${o.erreur.slice(1)}.` : ""}`.trim(),
        }));
      },
    },
    {
      id: "milieu",
      type: "choix",
      titre: "Rester au milieu",
      notions: ["full_unit_cost", "contribution_margin"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return k.coince
          ? `Au milieu, ${k.f.entreprise} n'a ni la part de marché de la domination par les coûts (${pct(k.couts.part)}, contre ${pct(k.milieu.part)}), ni la marge par enceinte de la différenciation (${eur(k.differenciation.margeUnitaire)}, contre ${eur(k.milieu.margeUnitaire)}). Par le résultat de l'année, où le milieu se classe-t-il ?`
          : "Par le résultat de l'année, où le milieu se classe-t-il face aux deux stratégies ?";
      },
      options: (c) => {
        const k = coutsOuDifferenciation(c);
        const m = k.milieu;
        const classement = `le milieu donne ${eur(m.resultat)}, la domination par les coûts ${eur(k.couts.resultat)}, la différenciation ${eur(k.differenciation.resultat)}`;
        return [
          {
            texte: "Dernier des trois",
            juste: k.rangDuMilieu === "dernier",
            retour:
              k.rangDuMilieu === "dernier"
                ? `Oui : ${classement}. C'est l'enlisement au milieu : ${k.f.entreprise} n'a ni le volume qui baisse le coût complet d'une enceinte (${eur(m.coutComplet)}, contre ${eur(k.couts.coutComplet)} avec les coûts), ni la marge par enceinte qui paie la qualité (${eur(m.margeUnitaire)}, contre ${eur(k.differenciation.margeUnitaire)}). ${k.soundbox.nom} tient déjà le prix bas, ${k.auris.nom} le haut de gamme.`
                : `Non : ${classement}.`,
          },
          {
            texte: "Premier des trois",
            juste: k.rangDuMilieu === "premier",
            retour: k.rangDuMilieu === "premier" ? `Oui : ${classement}.` : `Non : ${classement}. Ne rien changer n'est pas le choix le plus sûr.`,
          },
          {
            texte: "Entre les deux stratégies",
            juste: k.rangDuMilieu === "entre",
            retour: k.rangDuMilieu === "entre" ? `Oui : ${classement}.` : `Non : ${classement}. Les deux stratégies battent le milieu.`,
          },
        ];
      },
    },
    {
      id: "predire-le-rattrapage",
      type: "choix",
      titre: "Pariez sur le rattrapage",
      notions: ["demand_market_share", "contribution_margin"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `La domination par les coûts gagne ${eur(k.ecartEntreLesDeux)} de moins que la différenciation. Pariez : à ${eur(k.couts.margeUnitaire)} de marge par enceinte et à charges égales, combien de ventes de plus lui faudrait-il pour la rattraper ?`;
      },
      options: (c) => {
        const k = coutsOuDifferenciation(c);
        const voir = "Faites varier ses ventes à l'étape suivante : le curseur montre où son résultat rejoint celui de la différenciation.";
        const n = k.enceintesDePlus;
        return [
          { texte: "Moins de 2 000 ventes de plus", juste: n < 2_000, retour: `${n < 2_000 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Entre 2 000 et 5 000 ventes de plus", juste: n >= 2_000 && n <= 5_000, retour: `${n >= 2_000 && n <= 5_000 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Au-delà de 5 000 ventes de plus", juste: n > 5_000, retour: `${n > 5_000 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
        ];
      },
    },
    {
      id: "le-volume-au-curseur",
      type: "curseur",
      titre: "Rattraper par le volume",
      notions: ["demand_market_share", "contribution_margin"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `Faites varier les ventes de l'année avec la domination par les coûts, de ${qte(VENTES_DU_CURSEUR_DU_RATTRAPAGE.min)} à ${qte(VENTES_DU_CURSEUR_DU_RATTRAPAGE.max)} ${k.f.unites}, à ${eur(k.couts.margeUnitaire)} de marge par enceinte et à ses charges de l'année (${eur(k.couts.charges)}). Placez le curseur sur le plus petit nombre de ventes où son résultat égale celui de la différenciation (${eur(k.differenciation.resultat)}), puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Ventes de l'année, avec la stratégie de coûts", unite: coutsOuDifferenciation(c).f.unites }),
      cible: (c) => {
        const k = coutsOuDifferenciation(c);
        return { attendu: k.ventesPourEgaler, min: VENTES_DU_CURSEUR_DU_RATTRAPAGE.min, max: VENTES_DU_CURSEUR_DU_RATTRAPAGE.max };
      },
      zones: ["La stratégie de coûts rattrape", "La différenciation reste devant"],
      rates: () => ({
        dessous: "À cette position, la stratégie de coûts gagne encore moins que la différenciation.",
        dessus: "Plus bas, son résultat égale encore celui de la différenciation : cherchez le plus petit nombre de ventes.",
      }),
      montrer: "Montrer le rattrapage",
      lecture: (c, q) => {
        const k = coutsOuDifferenciation(c);
        const r = auCentime(k.couts.margeUnitaire * q - k.couts.charges);
        return [
          { libelle: "Marge sur coût variable", montant: auCentime(k.couts.margeUnitaire * q) },
          { libelle: "Charges fixes et budgets de l'année", montant: k.couts.charges },
          { libelle: "Résultat de la stratégie de coûts", montant: r },
          { libelle: "Écart avec la différenciation", montant: auCentime(r - k.differenciation.resultat), fort: true },
        ];
      },
      droites: (c) => {
        const k = coutsOuDifferenciation(c);
        return {
          produit: (q) => k.couts.margeUnitaire * q - k.couts.charges,
          cout: () => k.differenciation.resultat,
          libelles: ["Résultat de la stratégie de coûts", "Résultat de la différenciation"],
        };
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          `Il faudrait à la stratégie de coûts ${qte(k.ventesPourEgaler)} ${k.f.unites}, ${qte(k.enceintesDePlus)} de plus qu'elle n'en vend : chaque enceinte de plus n'y rapporte que ${eur(k.couts.margeUnitaire)}, et l'écart à combler est de ${eur(k.ecartEntreLesDeux)}.`,
          `Or le marché ne grandit pas : ces ventes, il faudrait les prendre à ${k.soundbox.nom} et à ${k.auris.nom}, donc baisser encore le prix, ce qui baisse la marge de chaque enceinte. La course au volume demande toujours plus de volume. L'étape suivante refait ce calcul.`,
        ];
      },
    },
    {
      id: "ce-qu-il-faudrait-vendre",
      type: "montants",
      titre: "Ce qu'il faudrait vendre",
      notions: ["demand_market_share", "contribution_margin"],
      question: () =>
        "Sans le curseur cette fois. Retrouvez par le calcul les ventes qu'il faudrait à la domination par les coûts pour égaler le résultat de la différenciation, les ventes que cela fait de plus qu'aujourd'hui avec cette stratégie, puis la part du marché de l'année qu'elles représenteraient.",
      champs: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          {
            libelle: "Ventes qu'il faudrait à la stratégie de coûts",
            attendu: k.ventesPourEgaler,
            calcul: `(${eur(k.differenciation.resultat)} + ${eur(k.couts.charges)}) ÷ ${eur(k.couts.margeUnitaire)} = ${qte(auCentieme((k.differenciation.resultat + k.couts.charges) / k.couts.margeUnitaire))}, arrondi à ${qte(k.ventesPourEgaler)} ${k.f.unites}`,
            tolerance: 0,
          },
          { libelle: "Ventes de plus qu'avec la stratégie de coûts", attendu: k.enceintesDePlus, calcul: `${qte(k.ventesPourEgaler)} − ${qte(k.couts.ventes)} = ${qte(k.enceintesDePlus)}`, tolerance: 0 },
          {
            libelle: "Part de marché qu'il faudrait (%)",
            attendu: auCentieme(k.partPourEgaler * 100),
            calcul: `${qte(k.ventesPourEgaler)} ÷ ${qte(k.s.annees.couts.marche)} × 100 = ${pct(k.partPourEgaler)}`,
          },
        ];
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          `Ventes nécessaires = (résultat visé + charges fixes et budgets) ÷ marge par enceinte. Il faudrait ${pct(k.partPourEgaler)} du marché, contre ${pct(k.couts.part)} : une stratégie de coûts vit du volume, et chaque euro de marge en moins se paie en ventes en plus.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Le coût qu'il faudrait au milieu",
      notions: ["full_unit_cost", "variable_costs"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `Le directeur propose de rester au milieu, mais en produisant moins cher : même prix (${eur(k.milieu.offre.prix)}), même qualité perçue, donc mêmes ventes (${qte(k.milieu.ventes)} ${k.f.unites}), mêmes charges. Le coût d'une enceinte ne change pas son attractivité. Retrouvez la marge par enceinte qu'il faudrait au milieu pour gagner autant que la différenciation, le coût variable le plus haut qui la donne, et la baisse que cela demande sur chaque enceinte.`;
      },
      champs: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          {
            libelle: "Marge par enceinte qu'il faudrait au milieu",
            attendu: k.margeNecessaire,
            calcul: `(${eur(k.differenciation.resultat)} + ${eur(k.milieu.charges)}) ÷ ${qte(k.milieu.ventes)} = ${eur(k.margeNecessaire)}`,
          },
          { libelle: "Coût variable le plus haut", attendu: k.coutVariableMaximal, calcul: `${eur(k.milieu.offre.prix)} − ${eur(k.margeNecessaire)} = ${eur(k.coutVariableMaximal)}` },
          { libelle: "Baisse du coût variable par enceinte", attendu: k.baisseDuCoutVariable, calcul: `${eur(k.milieu.coutVariable)} − ${eur(k.coutVariableMaximal)} = ${eur(k.baisseDuCoutVariable)}` },
        ];
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        const std = k.offres[0]!.gamme;
        const st = k.standardAuPrixDuMilieu;
        return [
          `Il faudrait au milieu ${eur(k.baisseDuCoutVariable)} de moins sur chaque enceinte, sans rien perdre en qualité. La seule gamme moins chère de la ligne, ${std.nom}, coûte ${eur(std.composants + std.autres)}, mais sa qualité de conception n'est que de ${dec(std.qualiteDeConception)} : vendue ${eur(k.milieu.offre.prix)}, elle ne fait que ${qte(st.ventes)} ventes, contre ${qte(k.milieu.ventes)}, pour ${eur(st.resultat)} de résultat. ${st.resultat < k.differenciation.resultat ? `Les euros économisés ne rattrapent pas la différenciation (${eur(k.differenciation.resultat)}) : ils se paient en ventes perdues.` : ""}`.trim(),
          "C'est l'enlisement : au milieu, on ne réduit ses coûts qu'en perdant de la qualité, et on ne gagne de la qualité qu'en payant plus. Une stratégie choisit son côté, et règle son prix sur lui.",
        ];
      },
    },
    {
      id: "predire-auris",
      type: "choix",
      titre: "Pariez sur l'offre qui bat Auris",
      notions: ["demand_market_share", "price_elasticity"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `Aucune stratégie du chapitre ne bat ${k.auris.nom} dans la même année : ${eur(k.couts.resultat - k.aurisDansLAnnee.couts)} avec la domination par les coûts, ${eur(k.differenciation.resultat - k.aurisDansLAnnee.differenciation)} avec la différenciation. Pariez : laquelle de ces offres y parvient ?`;
      },
      options: (c) => {
        const k = coutsOuDifferenciation(c);
        const voir = "Le laboratoire de l'étape suivante vous le dira : essayez-la.";
        const p = k.paris;
        return [
          { texte: `La gamme actuelle, à son meilleur prix (${eur(k.meilleurActuel.prix)})`, juste: p.actuelle.battue, retour: `${p.actuelle.battue ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          {
            texte: `La gamme soignée à ${eur(VARIANTE_DE_L_EXPERT.prix)}, sans budget en plus`,
            juste: p.soignee.battue,
            retour: `${p.soignee.battue ? "Bon pari." : "Pari à vérifier."} ${voir}`,
          },
          {
            texte: `La différenciation du chapitre, vendue ${eur(PRIX_DE_LA_DIFFERENCIATION_PLUS_CHERE)}`,
            juste: p.plusChere.battue,
            retour: `${p.plusChere.battue ? "Bon pari." : "Pari à vérifier."} ${voir}`,
          },
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-offre",
      type: "simulation",
      titre: "Le laboratoire de l'offre",
      notions: ["demand_market_share", "price_elasticity", "contribution_margin"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `Réglez l'offre ${dE(k.f.entreprise)} pour toute l'année : son prix, sa gamme, son budget qualité et sa communication par trimestre. Le tableau suit ses ventes, son résultat et celui ${dE(k.auris.nom)} la même année ; le graphique, les deux résultats selon le prix. Relevez le défi, puis regardez ce que vous avez gagné.`;
      },
      leviers: (c) => {
        const k = coutsOuDifferenciation(c);
        const o = k.milieu.offre;
        return [
          { code: "prix", libelle: "Prix de vente", unite: "€", ...PRIX_DU_LABORATOIRE, depart: o.prix },
          {
            code: "gamme",
            libelle: "Gamme",
            unite: "",
            min: 0,
            max: GAMMES_DU_LABORATOIRE.length - 1,
            pas: 1,
            depart: GAMMES_DU_LABORATOIRE.indexOf("actuelle"),
            choix: GAMMES_DU_LABORATOIRE.map((g, i) => {
              const x = gammeDe(k.f, g);
              return { valeur: i, libelle: `${x.nom.charAt(0).toUpperCase()}${x.nom.slice(1)} (${eur(x.composants + x.autres)})` };
            }),
          },
          { code: "qualite", libelle: "Budget qualité par trimestre", unite: "€", ...BUDGET_DU_LABORATOIRE, depart: o.budgetQualite },
          { code: "communication", libelle: "Communication par trimestre", unite: "€", ...BUDGET_DU_LABORATOIRE, depart: o.budgetCommunication },
        ];
      },
      lecture: (c, p) => {
        const k = coutsOuDifferenciation(c);
        const l = laboratoireDeLOffre(k.f, p);
        const d = { nova: k.milieu, auris: k.s.annees.milieu.auris };
        return [
          { libelle: `Ventes ${dE(k.f.entreprise)}`, montant: l.nova.ventes, unite: k.f.unites, reference: d.nova.ventes },
          { libelle: `Part de marché ${dE(k.f.entreprise)}`, montant: auCentieme(l.nova.part * 100), unite: "%", reference: auCentieme(d.nova.part * 100) },
          { libelle: "Demande perdue, faute de capacité", montant: l.nova.refusees, unite: k.f.unites, reference: d.nova.refusees },
          { libelle: "Marge par enceinte", montant: l.nova.margeUnitaire, reference: d.nova.margeUnitaire },
          { libelle: `Résultat ${dE(k.f.entreprise)}`, montant: l.nova.resultat, reference: d.nova.resultat },
          { libelle: `Résultat ${dE(k.auris.nom)}`, montant: l.auris.resultat, reference: d.auris.resultat },
          { libelle: "Résultat gagné sur aujourd'hui", montant: auCentime(l.nova.resultat - d.nova.resultat), reference: 0, effet: true },
          { libelle: `Avance sur ${k.auris.nom}`, montant: l.ecart, reference: auCentime(d.nova.resultat - d.auris.resultat), effet: true, fort: true },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      // Les deux résultats selon le prix ne sont pas des droites : la demande suit le prix puissance 4.
      graphique: (c) => {
        const k = coutsOuDifferenciation(c);
        return {
          levier: "prix",
          courbes: [
            { libelle: `Résultat ${dE(k.f.entreprise)}`, valeur: (p) => laboratoireDeLOffre(k.f, p).nova.resultat + 0 },
            { libelle: `Résultat ${dE(k.auris.nom)}`, valeur: (p) => laboratoireDeLOffre(k.f, p).auris.resultat + 0 },
          ],
        };
      },
      defi: (c) => {
        const k = coutsOuDifferenciation(c);
        const o = k.milieu.offre;
        return {
          consigne: `Battez ${k.auris.nom} en résultat, dans la même année.`,
          atteint: (p) => laboratoireDeLOffre(k.f, p).battue,
          indice: (p) => {
            const l = laboratoireDeLOffre(k.f, p);
            const g = GAMMES_DU_LABORATOIRE[p.gamme!]!;
            const conseil =
              g === "actuelle"
                ? `La gamme actuelle est déjà à son meilleur prix (${eur(k.meilleurActuel.prix)} ne donne que ${eur(k.meilleurActuel.resultat)}) : changez d'offre.`
                : g === "soignee"
                  ? "La gamme soignée se vend plus cher, mais pas trop : regardez où les deux courbes se croisent, et ce que chaque budget en plus rapporte vraiment."
                  : "La gamme standard ne se vend qu'à petit prix : regardez aussi ce que fait l'autre bout de la ligne.";
            return `Il manque ${eur(-l.ecart)} : ${k.f.entreprise} fait ${eur(l.nova.resultat)}, ${k.auris.nom} ${eur(l.auris.resultat)}. ${conseil}`;
          },
          solution: { prix: VARIANTE_DE_L_EXPERT.prix, gamme: GAMMES_DU_LABORATOIRE.indexOf(VARIANTE_DE_L_EXPERT.gamme), qualite: o.budgetQualite, communication: o.budgetCommunication },
        };
      },
      explication: (c, p) => {
        const k = coutsOuDifferenciation(c);
        const l = laboratoireDeLOffre(k.f, p);
        const g = GAMMES_DU_LABORATOIRE[p.gamme!]!;
        const m = k.meilleurSoigne;
        const debut = `${k.f.entreprise} bat ${k.auris.nom} de ${eur(l.ecart)} : ${eur(l.nova.resultat)} contre ${eur(l.auris.resultat)}, la même année.`;
        if (g === "standard")
          return [
            `${debut} En cassant les prix, ${k.f.entreprise} prend des ventes à ${k.auris.nom}, qui n'en fait plus que ${qte(l.auris.ventes)} : elle la bat en la faisant reculer, pas en gagnant le plus. Avec la gamme standard, ${k.f.entreprise} ne dépasse jamais ${eur(k.meilleurStandard.resultat)} (à ${eur(k.meilleurStandard.prix)}, avec les budgets d'aujourd'hui).`,
            `La gamme soignée vendue ${eur(m.prix)}, avec les budgets d'aujourd'hui, bat aussi ${k.auris.nom} et donne à ${k.f.entreprise} ${eur(m.resultat)}, son meilleur résultat. Battre un concurrent n'est pas un but : gagner le plus en est un.`,
          ];
        return [
          `${debut} La gamme soignée paie sa qualité : à ${eur(p.prix!)}, chaque enceinte laisse ${eur(l.nova.margeUnitaire)} de marge. Le meilleur résultat ${dE(k.f.entreprise)} est à ${eur(m.prix)} avec les budgets d'aujourd'hui (${eur(m.resultat)}). Moins cher, l'avance sur ${k.auris.nom} grandit (${eur(k.plusBas.bilan.ecart)} à ${eur(k.plusBas.prix)}), mais le résultat ${dE(k.f.entreprise)} baisse (${eur(k.plusBas.bilan.nova.resultat)}) : battre ${k.auris.nom} n'est pas gagner le plus.`,
          `La différenciation du chapitre n'y parvenait pas : ses ${eur(k.differenciation.budgets - k.milieu.budgets)} de budgets en plus sur l'année ne rapportent pas ce qu'ils coûtent, et à ${eur(k.differenciation.offre.prix)} elle laissait trop de clients à ${k.auris.nom}. Une stratégie générique donne la direction ; le prix et les budgets se règlent ensuite.`,
        ];
      },
    },
    {
      id: "battre-auris-a-la-main",
      type: "montants",
      titre: "L'année de la gamme soignée, à la main",
      notions: ["demand_market_share", "price_elasticity", "income_statement"],
      tableau: (c) => {
        const k = coutsOuDifferenciation(c);
        const v = k.variante;
        const sb = k.s.annees.milieu.soundbox;
        const au = k.s.annees.milieu.auris;
        return {
          titre: `Les trois offres de l'année, ${k.f.entreprise} en gamme soignée à ${eur(VARIANTE_DE_L_EXPERT.prix)}`,
          colonnes: [k.f.entreprise, k.soundbox.nom, k.auris.nom],
          lignes: [
            { libelle: "Prix de vente", valeurs: [eur(v.nova.offre.prix), eur(sb.offre.prix), eur(au.offre.prix)] },
            { libelle: "Qualité perçue", valeurs: [dec(v.nova.qualite), dec(sb.qualite), dec(au.qualite)] },
            { libelle: "Attractivité", valeurs: ["à calculer", dec(v.attractiviteSoundbox, 4), dec(v.attractiviteAuris, 4)] },
            { libelle: "Coût variable d'une enceinte", valeurs: [eur(v.nova.coutVariable), eur(sb.coutVariable), eur(au.coutVariable)] },
            { libelle: "Charges fixes et budgets de l'année", valeurs: [eur(v.nova.charges), eur(sb.charges), eur(au.charges)] },
          ],
        };
      },
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `${k.f.entreprise} monte la gamme soignée, la vend ${eur(VARIANTE_DE_L_EXPERT.prix)} et garde ses budgets d'aujourd'hui ; les concurrents ne bougent pas, et le marché reste de ${qte(k.f.marche.parTrimestre)} ${k.f.unites} par trimestre. Refaites l'année à la main : la part de marché ${dE(k.f.entreprise)} chaque trimestre (au centième de pour cent), ses ventes de l'année (à l'enceinte, chaque trimestre), son résultat, puis le résultat ${dE(k.auris.nom)} la même année.`;
      },
      champs: (c) => {
        const k = coutsOuDifferenciation(c);
        const v = k.variante;
        const t = k.f.marche.trimestres;
        return [
          {
            libelle: `Part de marché ${dE(k.f.entreprise)}, chaque trimestre (%)`,
            attendu: v.partDuTrimestre,
            calcul: `(${qte(k.f.attractivite.prixDeReference)} ÷ ${qte(VARIANTE_DE_L_EXPERT.prix)}) puissance ${k.f.attractivite.elasticiteAuPrix} × ${dec(v.nova.qualite)} au carré = ${dec(v.attractiviteNova, 4)} ; ${dec(v.attractiviteNova, 4)} ÷ (${dec(v.attractiviteNova, 4)} + ${dec(v.attractiviteSoundbox, 4)} + ${dec(v.attractiviteAuris, 4)}) × 100 = ${qte(v.partDuTrimestre)} %`,
          },
          {
            libelle: `Ventes ${dE(k.f.entreprise)} sur l'année`,
            attendu: v.nova.ventes,
            calcul: `${qte(v.partDuTrimestre)} % × ${qte(k.f.marche.parTrimestre)} = ${qte(v.ventesDuTrimestre)} ${k.f.unites} par trimestre, × ${t} = ${qte(v.nova.ventes)}`,
            tolerance: 0,
          },
          {
            libelle: `Résultat ${dE(k.f.entreprise)}`,
            attendu: v.nova.resultat,
            calcul: `${qte(v.nova.ventes)} × (${eur(v.nova.offre.prix)} − ${eur(v.nova.coutVariable)}) − ${eur(v.nova.charges)} = ${eur(v.nova.resultat)}`,
            tolerance: 1,
          },
          {
            libelle: `Résultat ${dE(k.auris.nom)} la même année`,
            attendu: v.auris.resultat,
            calcul: `${dec(v.attractiviteAuris, 4)} ÷ ${dec(v.sommeDesAttractivites, 4)} × ${qte(k.f.marche.parTrimestre)} = ${qte(v.ventesDAurisDuTrimestre)} ${k.f.unites} par trimestre ; ${qte(v.auris.ventes)} × ${eur(v.auris.margeUnitaire)} − ${eur(v.auris.charges)} = ${eur(v.auris.resultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        const v = k.variante;
        const plus = v.auris.resultat > k.aurisDansLAnnee.milieu;
        return [
          `${k.f.entreprise} gagne ${eur(v.nova.resultat)}, ${k.auris.nom} ${eur(v.auris.resultat)} : ${signe(v.ecart)} d'avance. ${k.f.entreprise} vend ${qte(v.nova.ventes)} ${k.f.unites}, contre ${qte(k.milieu.ventes)} aujourd'hui, mais chacune lui laisse ${eur(v.nova.margeUnitaire)} au lieu de ${eur(k.milieu.margeUnitaire)} : la qualité soutient la demande malgré le prix plus haut.`,
          `${plus ? `${k.auris.nom} gagne même un peu plus qu'aujourd'hui (${eur(k.aurisDansLAnnee.milieu)}) : ${k.f.entreprise}, plus chère, lui laisse quelques clients.` : `${k.auris.nom} gagne moins qu'aujourd'hui (${eur(k.aurisDansLAnnee.milieu)}).`} Dans un marché qui ne grandit pas, chaque décision change les ventes de tous : on ne lit le résultat d'un concurrent que dans la même année, avec ce que l'on fait soi-même.`,
        ];
      },
    },
    {
      id: "les-limites",
      type: "choix",
      titre: "Ce que vaut ce classement",
      notions: ["price_elasticity", "segmentation"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return `Le directeur conclut : « La simulation prouve que la différenciation est la bonne stratégie pour ${k.f.entreprise}. » Quelle limite lui opposez-vous ?`;
      },
      options: (c) => {
        const k = coutsOuDifferenciation(c);
        const x = k.critique;
        const renverse = x.meilleure.code !== k.meilleure.code;
        return [
          {
            texte: "Le classement dépend des clients : moins sensibles à la qualité, ils le renverseraient",
            juste: renverse,
            retour: renverse
              ? `Oui. Si l'attractivité variait comme la qualité puissance ${ELASTICITE_A_LA_QUALITE_DE_LA_CRITIQUE} et non ${k.f.attractivite.elasticiteALaQualite}, la domination par les coûts ferait ${eur(x.couts.resultat)}, le milieu ${eur(x.milieu.resultat)}, la différenciation ${eur(x.differenciation.resultat)}. Et les concurrents ne réagissent pas : face à la stratégie de coûts, ${k.soundbox.nom} passerait de ${eur(k.soundboxDansLAnnee.milieu)} à ${eur(k.soundboxDansLAnnee.couts)}, et ne resterait pas sans rien faire. Une simulation éclaire une décision ; elle vaut ce que valent ses hypothèses.`
              : "Non : ici, le classement tient aussi avec des clients moins sensibles à la qualité.",
          },
          {
            texte: "Aucune : la simulation joue l'année entière, le classement est sûr",
            juste: !renverse,
            retour: !renverse
              ? "Oui : le classement tient avec d'autres hypothèses."
              : `Non : jouer l'année entière ne rend pas les hypothèses vraies. Avec des clients moins sensibles à la qualité, la domination par les coûts passerait devant (${eur(x.couts.resultat)} contre ${eur(x.differenciation.resultat)}).`,
          },
          {
            texte: "La domination par les coûts vend le plus : c'est elle qui devrait gagner",
            juste: false,
            retour: `Non : c'est confondre la part de marché et le résultat. La stratégie de coûts vend le plus (${pct(k.couts.part)}) et gagne ${eur(k.ecartEntreLesDeux)} de moins que la différenciation.`,
          },
          {
            texte: "Le classement oublie les charges fixes, qui sont les mêmes partout",
            juste: false,
            retour: `Non : les charges fixes (${eur(k.milieu.chargesFixes)}) et les budgets de chaque stratégie sont dans le résultat, et dans le coût complet que vous avez calculé.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share", "full_unit_cost", "breakeven"],
      tableau: tableauDuBilan,
      texte: (c) => {
        const k = coutsOuDifferenciation(c);
        const m = k.meilleure;
        return [
          `Chez ${k.f.entreprise}, ${NOMS_DES_STRATEGIES[m.code]} donne le meilleur résultat de l'année (${eur(m.bilan.resultat)}), et le milieu se classe ${rangEcrit(k.rangDuMilieu)}. La stratégie de coûts vend le plus et gagne le moins par enceinte ; la différenciation, l'inverse, avec le seuil de rentabilité le plus bas.`,
          "Une stratégie générique est un choix cohérent : la domination par les coûts baisse le coût de la gamme, les budgets et le prix, et vit du volume ; la différenciation monte la gamme, la qualité et le prix, et vit de la marge. Rester au milieu, c'est n'avoir ni le volume de l'une ni la marge de l'autre. Et le réglage compte autant que la direction : la gamme soignée vendue moins cher, sans budget en plus, bat même le haut de gamme.",
          "Au niveau de l'examen, vous savez comparer des stratégies par la part de marché, la marge par enceinte, le coût complet, le seuil de rentabilité et le résultat ; retrouver à rebours le volume ou le coût qu'une stratégie demanderait ; refaire une année à la main ; et dire ce qu'un classement doit à ses hypothèses.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Part de marché = ventes ÷ marché × 100. Marge par enceinte = prix − coût variable. Coût complet = coût variable + (charges fixes + budgets) ÷ ventes. Seuil de rentabilité = (charges fixes + budgets) ÷ marge par enceinte. Une stratégie se juge au résultat de l'année, pas à la part de marché seule.",
    },
  ],
};
