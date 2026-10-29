import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { coefficientDActualisation, fluxDuProjet, tri, van, type FluxDuProjet } from "../monde/finance";
import {
  BETA_DE_L_ACTIF_DE_NOVA,
  PRIME_DE_RISQUE_DU_MARCHE,
  PROJET_BANC_DE_MESURE,
  PROJET_LIGNE_MANUELLE,
  PROJET_LIGNE_SEMI_AUTOMATIQUE,
  TAUX_D_ACTUALISATION_DE_NOVA,
  TAUX_DE_L_IMPOT_DES_PROJETS,
  TAUX_SANS_RISQUE,
  type ProjetDInvestissement,
} from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA VALEUR ACTUELLE NETTE D'UN INVESTISSEMENT (DSCG, UE2 Finance, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : les projets
 * de NOVA ont une fiche figée (monde/projets-et-financement.ts) et leurs flux se calculent par le
 * modèle du cours (monde/finance.ts, `fluxDuProjet`, `van`). Une évolution du moteur ne change rien
 * ici, et le chapitre n'importe plus aucun autre chapitre : ni l'impôt sur les sociétés, ni le
 * déficit reporté, ni « Croître en investissant ».
 *
 * L'objet : le projet A de NOVA, la gamme Go et Studio lancée en N+1 sur une seconde ligne
 * manuelle (60 000 €, amortie sur 6 ans, revendue à 60 % de sa valeur nette comptable), avec des
 * moules de 40 000 € sans valeur de revente. Cinq ans de flux annuels : le chiffre d'affaires
 * différentiel (les ventes de NOVA One que Studio fait perdre en moins), les coûts variables, les
 * charges fixes, l'impôt de 25 % sur le résultat d'exploitation que le projet ajoute (une perte
 * fait économiser l'impôt du reste de NOVA), le BFR de 10 % du chiffre d'affaires, constitué au
 * début de chaque année et récupéré à la fin, et la valeur résiduelle nette d'impôt. Le tout
 * actualisé à 9 %, le coût du capital de l'activité de NOVA (MEDAF, βa de 1, pas de dette nette).
 *
 * L'AUDIT (octobre 2026) relevait deux défauts : des ordres de grandeur irréalistes (un rayonnage
 * de 16 000 € à 182 % de TRI par an) et un BFR laissé hors des flux. Les deux sont corrigés : les
 * flux sont ceux d'un vrai lancement de gamme, et le BFR est compté, puis l'oublier devient une
 * expérience (le levier à choix du laboratoire) et une critique chiffrée.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DSCG) :
 *   · guidé : intro, le-flux-d-une-annee, l-annee-de-lancement, le-taux-et-le-temps (la formule
 *     est au repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-bfr
 *     puis le-laboratoire-de-la-gamme (le BFR compté ou oublié, la durée, le taux, les ventes ; la
 *     VAN selon le taux en graphique ; trouver la durée la plus courte qui crée de la valeur) avant
 *     le-bfr et les-flux-disponibles ; predire-les-ventes puis les-ventes-au-curseur (les ventes qui
 *     annulent la VAN) avant le-seuil-des-ventes ; le-prix-de-studio (un second curseur) avant
 *     quel-risque-surveiller ;
 *   · autonome : le-bfr, la-valeur-residuelle, decision (ni formule ni chiffres donnés ; le calcul de
 *     la correction montre le chemin) ;
 *   · expert : les-flux-disponibles (le tableau des flux de trésorerie disponibles en entier, impôt
 *     et BFR compris), ce-que-coute-le-bfr (une critique chiffrée du calcul sans BFR), le-seuil-des-
 *     ventes (un calcul à rebours : les ventes qui annulent la VAN), quel-risque-surveiller (un
 *     diagnostic qui croise deux sensibilités) ; puis la synthèse.
 *
 * CE QUI A DISPARU, AVEC L'ARÈNE : le taux trimestriel équivalent (les flux sont annuels), le rejeu
 * avec et sans la machine, l'écart entre l'impôt calculé et l'impôt prélevé par le moteur, les
 * entreprises où la machine ne faisait rien vendre. Le TRI vient au chapitre suivant.
 */

/** Les projets d'investissement se chiffrent chez NOVA, la seule entreprise du cours dont les projets ont une fiche. */
export const ENTREPRISES_DES_PROJETS: readonly string[] = ["nova"];

/** Les trois projets d'une entreprise du cours, son taux d'actualisation et son taux d'impôt marginal. */
export interface ProjetsDuCours {
  entreprise: string;
  /** Le projet A : la gamme sur une seconde ligne manuelle. */
  a: ProjetDInvestissement;
  /** Le projet B : la gamme sur une ligne semi-automatique, qui exclut A. */
  b: ProjetDInvestissement;
  /** Le projet C : le banc de mesure, indépendant des deux autres. */
  c: ProjetDInvestissement;
  taux: number;
  impot: number;
}

export const PROJETS_DU_COURS: Readonly<Record<string, ProjetsDuCours>> = {
  nova: {
    entreprise: PROJET_LIGNE_MANUELLE.entreprise,
    a: PROJET_LIGNE_MANUELLE,
    b: PROJET_LIGNE_SEMI_AUTOMATIQUE,
    c: PROJET_BANC_DE_MESURE,
    taux: TAUX_D_ACTUALISATION_DE_NOVA,
    impot: TAUX_DE_L_IMPOT_DES_PROJETS,
  },
};

/** Les projets de l'entreprise du cas (lue par son seul code). */
export function projetsDe(c: Pick<Cas, "code">): ProjetsDuCours {
  const p = PROJETS_DU_COURS[c.code];
  if (!p) throw new Error(`Pas de projets d'investissement pour l'entreprise ${c.code}`);
  return p;
}

/** L'année que les étapes guidées font calculer : N+3, la première où la gamme plafonne. */
export const ANNEE_GUIDEE = 3;

/** Les bornes du curseur des ventes, en pour cent du plan de la fiche. */
export const VENTES_DU_CURSEUR = { min: 60, max: 120 } as const;

/** Les bornes du curseur du prix de NOVA Studio, en euros. */
export const PRIX_DU_CURSEUR = { min: 100, max: 140 } as const;

/** Les leviers du laboratoire : la durée (en années), le taux (en pour cent), les ventes (en pour cent du plan). */
export const LEVIERS_DU_LABORATOIRE = {
  duree: { min: 2, pas: 1 },
  taux: { min: 0, max: 25, pas: 0.5 },
  ventes: { min: 60, max: 120, pas: 5 },
} as const;

/** Le levier à choix du laboratoire : le BFR oublié (la méthode fautive) ou compté. */
export const BFR_OUBLIE = 0;
export const BFR_COMPTE = 1;

/**
 * LES FLUX D'UN PROJET SANS SON BFR (le calcul fautif, que le chapitre critique) : l'investissement à
 * la date 0, les flux d'exploitation après impôt, la valeur résiduelle nette à la fin, et rien pour
 * le BFR. À proposer à monde/finance.ts si un autre chapitre en a besoin.
 */
export function fluxSansLeBfr(f: FluxDuProjet): number[] {
  return Array.from({ length: f.duree + 1 }, (_, k) =>
    auCentime((k === 0 ? -f.investissement : f.annees[k - 1]!.fluxDExploitation) + (k === f.duree ? f.valeurResiduelle : 0)),
  );
}

/** Une position du laboratoire : le BFR (oublié ou compté), la durée en années, le taux et les ventes en pour cent. */
export interface PositionDeLaGamme {
  bfr: number;
  duree: number;
  taux: number;
  ventes: number;
}

/** Le projet refait pour une position des leviers : ses flux, sa VAN, et sa VAN avec et sans le BFR. */
export function laboratoireDeLaGamme(p: ProjetDInvestissement, impot: number, x: Readonly<Record<string, number>>) {
  const f = fluxDuProjet(p, { duree: x.duree!, ventes: x.ventes! / 100, tauxDeLImpot: impot });
  const sans = fluxSansLeBfr(f);
  const t = x.taux! / 100;
  const compte = x.bfr === BFR_COMPTE;
  const flux = compte ? f.flux : sans;
  const vanAvecLeBfr = van(f.flux, t);
  const vanSansLeBfr = van(sans, t);
  return {
    f,
    flux,
    mise: auCentime(-flux[0]!),
    bfrRecupere: compte ? f.recuperationDuBfr : 0,
    valeurResiduelle: f.valeurResiduelle,
    van: compte ? vanAvecLeBfr : vanSansLeBfr,
    vanAvecLeBfr,
    vanSansLeBfr,
    coutDuBfr: auCentime(vanSansLeBfr - vanAvecLeBfr),
  };
}

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number, d = 2) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−")} %`;
const coef4 = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const auCentieme = (x: number) => Math.round(x * 100) / 100;
/** Le nom d'une date du projet : la date 0 est le 1er janvier N+1, la date k la fin de N+k. */
export const nomDeLaDate = (k: number) => (k === 0 ? "Date 0 (1er janvier N+1)" : `Date ${k} (fin de N+${k})`);
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Un libellé de la fiche, ses nombres écrits en chiffres (« deux opérateurs » devient « 2 opérateurs »). */
export const enChiffres = (libelle: string) => libelle.replace(/\bdeux\b/g, "2").replace(/\btrois\b/g, "3");
/** Le nom d'un produit de la fiche, sans la mention des ventes perdues. */
const nomDu = (pr: { nom: string }) => pr.nom.replace(/, ventes perdues$/, "");

/**
 * L'écart admis sur une valeur actuelle : l'élève qui lit ses coefficients à quatre décimales, comme
 * dans une table financière, s'écarte d'au plus un demi dix-millième de chaque flux.
 */
export const toleranceDActualisation = (flux: readonly number[]) => Math.max(1, Math.ceil(flux.reduce((s, f) => s + Math.abs(f), 0) * 0.00005));

/**
 * La plus petite position entière où une fonction croissante devient positive (le seuil d'un
 * curseur), cherchée autour d'une première estimation pour ne pas parcourir toute la course.
 */
export function premierPositif(f: (x: number) => number, min: number, max: number, estimation = min): number {
  let x = Math.min(max, Math.max(min, Math.ceil(estimation)));
  while (x > min && f(x - 1) >= 0) x--;
  while (x < max && f(x) < 0) x++;
  return x;
}

/** La plus grande position entière où une fonction décroissante reste positive, cherchée autour d'une estimation. */
export function dernierPositif(f: (x: number) => number, min: number, max: number, estimation = max): number {
  let x = Math.min(max, Math.max(min, Math.floor(estimation)));
  while (x < max && f(x + 1) >= 0) x++;
  while (x > min && f(x) < 0) x--;
  return x;
}

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Tout ce que le chapitre et son cas demandent du projet A (calculé une fois par entreprise). */
export function gammeDuChapitre(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Pick<Cas, "code">) {
  const k = projetsDe(c);
  const p = k.a;
  const t = k.taux;
  const tauxPct = auCentieme(t * 100);
  const f = fluxDuProjet(p, { tauxDeLImpot: k.impot });
  const sans = fluxSansLeBfr(f);
  const vanDuProjet = van(f.flux, t);
  const vanSansLeBfr = van(sans, t);
  const coefs = f.flux.map((_, d) => coefficientDActualisation(t, d));
  const actualises = f.flux.map((x, d) => auCentime(x * coefs[d]!));
  const guidee = f.annees[ANNEE_GUIDEE - 1]!;
  const lancement = f.annees[0]!;
  const [go, studio, one] = p.produits;
  const ligne = f.residuels[0]!;
  const equipements = auCentime(p.actifs.reduce((s, a) => s + a.montant, 0));
  const dotations = guidee.dotations;
  const sommeDesFlux = auCentime(f.flux.slice(1).reduce((s, x) => s + x, 0));
  // Le BFR : la valeur actuelle de ce qui revient à la fin du projet, et le coût du BFR en VAN.
  const vaDuBfrRecupere = auCentime(f.recuperationDuBfr * coefs[f.duree]!);
  const coutDuBfr = auCentime(vanSansLeBfr - vanDuProjet);
  // La sensibilité aux ventes : la VAN est affine dans les ventes (les quantités, le chiffre d'affaires, le BFR et l'impôt les suivent).
  const vanAuxVentes = (pourCent: number) => van(fluxDuProjet(p, { ventes: pourCent / 100, tauxDeLImpot: k.impot }).flux, t);
  const VENTES_BASSES = 80;
  const vanAuxVentesBasses = vanAuxVentes(VENTES_BASSES);
  const penteDesVentes = (vanDuProjet - vanAuxVentesBasses) / (100 - VENTES_BASSES);
  const seuilDesVentes = auCentieme(100 - vanDuProjet / penteDesVentes);
  // Le prix de NOVA Studio : la VAN est affine dans son prix.
  const vanAuPrix = (prix: number) => van(fluxDuProjet(p, { prix: { [studio!.code]: prix }, tauxDeLImpot: k.impot }).flux, t);
  const penteDuPrix = auCentime(vanDuProjet - vanAuPrix(studio!.prix - 1));
  const prixPlancher = auCentieme(studio!.prix - vanDuProjet / penteDuPrix);
  // Le laboratoire : la durée la plus courte qui crée encore de la valeur, BFR compté, au taux et aux ventes du plan.
  const plan = { bfr: BFR_COMPTE, duree: p.duree, taux: tauxPct, ventes: 100 };
  const lab = (x: Partial<PositionDeLaGamme>) => laboratoireDeLaGamme(p, k.impot, { ...plan, ...x });
  let dureeMinimale = p.duree;
  for (let d = p.duree; d >= LEVIERS_DU_LABORATOIRE.duree.min; d--) if (lab({ duree: d }).van > 0) dureeMinimale = d;
  return {
    k,
    p,
    entreprise: k.entreprise,
    t,
    tauxPct,
    impotPct: auCentieme(k.impot * 100),
    f,
    sans,
    van: vanDuProjet,
    vanSansLeBfr,
    coefs,
    actualises,
    guidee,
    lancement,
    go: go!,
    studio: studio!,
    one: one!,
    ligne,
    equipements,
    dotations,
    sommeDesFlux,
    vaDuBfrRecupere,
    coutDuBfr,
    partDuBfr: auCentieme((coutDuBfr / vanDuProjet) * 100),
    tolerance: toleranceDActualisation(f.flux),
    toleranceSansBfr: toleranceDActualisation(sans),
    vaDeCent: auCentime(100 * coefs[f.duree]!),
    vaDuFluxGuide: auCentime(guidee.fluxDExploitation * coefs[ANNEE_GUIDEE]!),
    vanAuxVentes,
    VENTES_BASSES,
    vanAuxVentesBasses,
    penteDesVentes: auCentime(penteDesVentes),
    seuilDesVentes,
    margeDesVentes: auCentieme(100 - seuilDesVentes),
    seuilEntierDesVentes: premierPositif(vanAuxVentes, VENTES_DU_CURSEUR.min, VENTES_DU_CURSEUR.max, seuilDesVentes),
    vanAuPrix,
    penteDuPrix,
    prixPlancher,
    baisseDuPrix: auCentieme(((studio!.prix - prixPlancher) / studio!.prix) * 100),
    prixEntier: premierPositif(vanAuPrix, PRIX_DU_CURSEUR.min, PRIX_DU_CURSEUR.max, prixPlancher),
    studioSurLeProjet: studio!.quantites.reduce((s, q) => s + q, 0),
    plan,
    lab,
    dureeMinimale,
    tri: tri(f.flux)!,
    verdict: (vanDuProjet > 0 ? "investir" : "renoncer") as "investir" | "renoncer",
  };
}

export type GammeDuChapitre = ReturnType<typeof gammeDuChapitre>;

/** Les ventes et les charges de la gamme, année par année : le document de départ. */
export function tableauDeLaGamme(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = gammeDuChapitre(c);
  const annees = x.f.annees.map((a) => `N+${a.annee}`);
  return {
    titre: `Le projet A ${dE(x.entreprise)} : ${x.p.nom}`,
    colonnes: annees,
    lignes: [
      ...x.p.produits.map((pr) => ({
        libelle: pr.quantites[0]! < 0 ? `Ventes de ${nomDu(pr)} perdues` : `${nomDu(pr)} vendues`,
        valeurs: pr.quantites.map((q) => qte(Math.abs(q))),
      })),
      ...x.p.charges.map((ch) => ({ libelle: `Charges fixes : ${enChiffres(ch.libelle)}`, valeurs: ch.montants.map(eur) })),
    ],
  };
}

/** Le prix et le coût variable de chaque produit de la gamme, et les équipements du projet. */
function tableauDesProduits(x: GammeDuChapitre): TableauDeDonnees {
  return {
    titre: "Ce que rapporte et coûte chaque enceinte",
    colonnes: ["Prix de vente", "Coût variable"],
    lignes: x.p.produits.map((pr) => ({ libelle: nomDu(pr), valeurs: [eur(pr.prix), eur(pr.coutVariable)] })),
  };
}

/** Les flux de trésorerie disponibles du projet, date par date, et leur valeur actuelle. */
function tableauDesFlux(x: GammeDuChapitre): TableauDeDonnees {
  return {
    titre: `Les flux de trésorerie disponibles du projet A, actualisés à ${pct(x.tauxPct)}`,
    colonnes: ["Flux de trésorerie disponible", "Coefficient d'actualisation", "Valeur actuelle"],
    lignes: [
      ...x.f.flux.map((fl, d) => ({ libelle: nomDeLaDate(d), valeurs: [eur(fl), coef4(x.coefs[d]!), eur(x.actualises[d]!)] })),
      { libelle: "Valeur actuelle nette", valeurs: ["", "", eur(x.van)] },
    ],
  };
}

export const LA_VALEUR_ACTUELLE_NETTE: Chapitre = {
  code: "la-valeur-actuelle-nette",
  parcours: "dscg-finance",
  palier: 4,
  blocs: ["DSCG UE2 · Finance"],
  titre: "La valeur actuelle nette d'un investissement",
  accroche:
    "NOVA lance sa gamme Go et Studio sur une seconde ligne : cinq ans de flux de trésorerie disponibles, impôt et BFR compris, une revente à la fin, et un taux qui donne un prix au temps. La VAN dit si le lancement crée de la valeur, et le laboratoire montre ce qui la fait basculer.",
  objectifs: [
    "Calculer les flux de trésorerie disponibles d'un projet : EBE, impôt sur le résultat d'exploitation, variation du BFR, valeur résiduelle nette d'impôt",
    "Compter l'économie d'impôt d'une année de lancement en perte, quand l'entreprise est bénéficiaire",
    "Actualiser les flux au coût du capital et calculer la valeur actuelle nette",
    "Chiffrer ce que coûte le BFR, et ce que l'oublier fait croire",
    "Retrouver à rebours les ventes et le prix qui annulent la VAN, et dire quel risque surveiller",
  ],
  libre: false,
  prerequis: ["immobilisations", "bilan-fonctionnel-et-bfr"],
  entreprises: {
    codes: ENTREPRISES_DES_PROJETS,
    pourquoi:
      "ce chapitre suit le lancement de la gamme Go et Studio de NOVA, le fabricant d'enceintes du cours : ses projets sont les seuls que la simulation du cours chiffre en entier, flux, impôt et BFR compris.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une gamme, une ligne, et le prix du temps",
      notions: ["discounting", "cannibalization"],
      tableau: tableauDeLaGamme,
      texte: (c) => {
        const x = gammeDuChapitre(c);
        const [ligne, moules] = x.p.actifs;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.entreprise}. Après son premier exercice, ${x.entreprise} veut lancer en N+1 ${x.p.nom.replace(/^la /, "sa ")} : il lui faut ${ligne!.libelle} (${eur(ligne!.montant)}, amortie sur ${qte(ligne!.dureeDAmortissement)} ans) et ${moules!.libelle} (${eur(moules!.montant)}, amortis sur ${qte(moules!.dureeDAmortissement)} ans). C'est le projet A. Le tableau donne ses ventes et ses charges fixes, année par année, sur ${qte(x.p.duree)} ans.`,
          `Ce que la simulation suppose. Les flux sont annuels : les équipements se paient à la date 0, le 1er janvier N+1, et chaque flux d'exploitation tombe à la fin de son année. Les flux sont différentiels : les ventes de ${nomDu(x.one)} que la gamme fait perdre se retirent. Le BFR vaut ${pct(x.p.partDuBfr * 100)} du chiffre d'affaires de l'année ; il se constitue au début de l'année et se récupère en entier à la fin du projet. L'impôt est de ${pct(x.impotPct)} du résultat d'exploitation que le projet ajoute : c'est le taux marginal de ${x.entreprise}, dont le bénéfice dépasse déjà le plafond du taux réduit, si bien qu'une perte du projet fait économiser ${pct(x.impotPct)} d'impôt sur le reste de son bénéfice. À la fin, la ligne se revend ${pct(ligne!.tauxDeReprise * 100)} de sa valeur nette comptable ; les moules ne se revendent pas.`,
          `On juge le projet sans son financement : le taux d'actualisation, ${pct(x.tauxPct)}, porte le coût des capitaux qu'il immobilise. Un euro reçu dans ${qte(x.p.duree)} ans vaut moins qu'un euro aujourd'hui : il faut actualiser.`,
        ];
      },
      repere: () =>
        "Flux de trésorerie disponible = EBE − impôt sur le résultat d'exploitation − variation du BFR − investissement + valeur résiduelle nette d'impôt. VAN = somme des flux de la date k × (1 + t)^(−k). Le projet crée de la valeur si sa VAN est positive.",
    },
    {
      id: "le-flux-d-une-annee",
      objectifs: [0],
      type: "montants",
      titre: "Le flux d'exploitation d'une année",
      notions: ["ebitda_margin", "income_statement"],
      tableau: (c) => tableauDesProduits(gammeDuChapitre(c)),
      question: (c) => {
        const x = gammeDuChapitre(c);
        const i = ANNEE_GUIDEE - 1;
        return `Prenez l'année N+${ANNEE_GUIDEE} : ${qte(x.go.quantites[i]!)} ${nomDu(x.go)} et ${qte(x.studio.quantites[i]!)} ${nomDu(x.studio)} vendues, ${qte(-x.one.quantites[i]!)} ventes de ${nomDu(x.one)} perdues, ${eur(x.guidee.chargesFixes)} de charges fixes et ${eur(x.dotations)} de dotations aux amortissements. Calculez le chiffre d'affaires différentiel (quantités × prix, les ventes perdues en moins), l'EBE (chiffre d'affaires − coûts variables − charges fixes), l'impôt (${pct(x.impotPct)} × (EBE − dotations)), puis le flux d'exploitation après impôt (EBE − impôt).`;
      },
      champs: (c) => {
        const x = gammeDuChapitre(c);
        const i = ANNEE_GUIDEE - 1;
        const a = x.guidee;
        const termes = (champ: "prix" | "coutVariable") =>
          x.p.produits.map((pr, j) => `${j === 0 ? "" : pr.quantites[i]! < 0 ? " − " : " + "}${qte(Math.abs(pr.quantites[i]!))} × ${eur(pr[champ])}`).join("");
        return [
          { libelle: `Chiffre d'affaires différentiel de N+${ANNEE_GUIDEE}`, attendu: a.chiffreDAffaires, calcul: `${termes("prix")} = ${eur(a.chiffreDAffaires)}` },
          {
            libelle: `EBE de N+${ANNEE_GUIDEE}`,
            attendu: a.excedentBrut,
            calcul: `${eur(a.chiffreDAffaires)} − (${termes("coutVariable")}) − ${eur(a.chargesFixes)} = ${eur(a.chiffreDAffaires)} − ${eur(a.coutsVariables)} − ${eur(a.chargesFixes)} = ${eur(a.excedentBrut)}`,
          },
          {
            libelle: `Impôt sur le résultat d'exploitation de N+${ANNEE_GUIDEE}`,
            attendu: a.impot,
            calcul: `${pct(x.impotPct)} × (${eur(a.excedentBrut)} − ${eur(a.dotations)}) = ${pct(x.impotPct)} × ${eur(a.resultatDExploitation)} = ${eur(a.impot)}`,
          },
          { libelle: `Flux d'exploitation après impôt de N+${ANNEE_GUIDEE}`, attendu: a.fluxDExploitation, calcul: `${eur(a.excedentBrut)} − ${eur(a.impot)} = ${eur(a.fluxDExploitation)}` },
        ];
      },
      explication: (c) => {
        const x = gammeDuChapitre(c);
        const a = x.guidee;
        return [
          `Le flux d'exploitation, ${eur(a.fluxDExploitation)}, est aussi le résultat d'exploitation après impôt plus les dotations : ${eur(a.resultatDExploitation)} × (1 − ${pct(x.impotPct)}) + ${eur(a.dotations)} = ${eur(a.fluxDExploitation)}. La dotation ne sort pas d'argent ; elle ne compte que par l'impôt qu'elle fait économiser, ${eur(auCentime(a.dotations * x.k.impot))}.`,
          `Les ventes de ${nomDu(x.one)} perdues sont un vrai coût du projet : sans la gamme, ${x.entreprise} les aurait faites. Un flux différentiel compare l'entreprise avec et sans le projet.`,
        ];
      },
    },
    {
      id: "l-annee-de-lancement",
      objectifs: [1],
      type: "choix",
      titre: "L'impôt d'une année en perte",
      notions: ["income_statement", "ebitda_margin"],
      question: (c) => {
        const x = gammeDuChapitre(c);
        const a = x.lancement;
        return `En N+1, la campagne de lancement et la montée des ventes font un EBE de ${eur(a.excedentBrut)}, et un résultat d'exploitation de ${eur(a.resultatDExploitation)} après ${eur(a.dotations)} de dotations. Le reste de ${x.entreprise} est bénéficiaire. Quel impôt compter dans le flux de N+1 ?`;
      },
      options: (c) => {
        const x = gammeDuChapitre(c);
        const a = x.lancement;
        const surLEbe = auCentime(a.excedentBrut * x.k.impot);
        return [
          {
            texte: `${eur(a.impot)} : une économie d'impôt sur le bénéfice du reste de ${x.entreprise}`,
            juste: true,
            retour: `Oui : sans le projet, ${x.entreprise} paierait ${eur(-a.impot)} d'impôt de plus. La perte du projet s'impute sur son bénéfice, au taux marginal de ${pct(x.impotPct)}. Le flux de N+1 vaut ${eur(a.excedentBrut)} − ${entre(a.impot)} = ${eur(a.fluxDExploitation)}.`,
          },
          {
            texte: "0 € : un résultat négatif ne paie pas d'impôt",
            juste: false,
            retour: `Non : c'est raisonner comme si le projet était une société seule. ${x.entreprise} est bénéficiaire : la perte du projet réduit son bénéfice imposable, et son impôt de ${eur(-a.impot)}.`,
          },
          {
            texte: `${eur(-a.impot)} : ${pct(x.impotPct)} du résultat, comme les autres années`,
            juste: false,
            retour: `Non : c'est un signe inversé. Sur un résultat de ${eur(a.resultatDExploitation)}, l'impôt est négatif : le projet en fait économiser ${eur(-a.impot)}, il n'en paie pas.`,
          },
          {
            texte: `${eur(surLEbe)} : ${pct(x.impotPct)} de l'EBE`,
            juste: false,
            retour: `Non : c'est la mauvaise base. L'impôt se calcule sur le résultat d'exploitation, après les dotations de ${eur(a.dotations)}, que la loi déduit : ${pct(x.impotPct)} × ${entre(a.resultatDExploitation)} = ${eur(a.impot)}.`,
          },
        ];
      },
    },
    {
      id: "le-taux-et-le-temps",
      objectifs: [2],
      type: "montants",
      titre: "Le taux d'actualisation et le prix du temps",
      notions: ["discounting"],
      question: (c) => {
        const x = gammeDuChapitre(c);
        return `Le taux d'actualisation de ${x.entreprise} est le coût du capital de son activité, par le MEDAF : taux sans risque de ${pct(TAUX_SANS_RISQUE * 100)}, plus le bêta de l'actif (${qte(BETA_DE_L_ACTIF_DE_NOVA)}) × la prime de risque du marché (${pct(PRIME_DE_RISQUE_DU_MARCHE * 100)}). Calculez-le, puis ce que valent aujourd'hui 100 € reçus à la date ${x.f.duree} (100 × (1 + t)^(−${x.f.duree})), et la valeur actuelle du flux d'exploitation de N+${ANNEE_GUIDEE}, ${eur(x.guidee.fluxDExploitation)}, reçu à la date ${ANNEE_GUIDEE}.`;
      },
      champs: (c) => {
        const x = gammeDuChapitre(c);
        return [
          {
            libelle: "Taux d'actualisation (%)",
            attendu: x.tauxPct,
            calcul: `${pct(TAUX_SANS_RISQUE * 100)} + ${qte(BETA_DE_L_ACTIF_DE_NOVA)} × ${pct(PRIME_DE_RISQUE_DU_MARCHE * 100)} = ${pct(x.tauxPct)}`,
          },
          { libelle: `Valeur actuelle de 100 € reçus à la date ${x.f.duree}`, attendu: x.vaDeCent, calcul: `100 × ${coef4(x.coefs[x.f.duree]!)} = ${eur(x.vaDeCent)}`, tolerance: 0.01 },
          {
            libelle: `Valeur actuelle du flux de N+${ANNEE_GUIDEE}`,
            attendu: x.vaDuFluxGuide,
            calcul: `${eur(x.guidee.fluxDExploitation)} × (1 + ${pct(x.tauxPct)})^(−${ANNEE_GUIDEE}) = ${eur(x.guidee.fluxDExploitation)} × ${coef4(x.coefs[ANNEE_GUIDEE]!)} = ${eur(x.vaDuFluxGuide)}`,
            tolerance: toleranceDActualisation([x.guidee.fluxDExploitation]),
          },
        ];
      },
      explication: (c) => {
        const x = gammeDuChapitre(c);
        return [
          `À ${pct(x.tauxPct)}, 100 € reçus dans ${qte(x.f.duree)} ans ne valent que ${eur(x.vaDeCent)} aujourd'hui : c'est ce qu'il faudrait placer aujourd'hui, au rendement qu'exigent les capitaux de ${x.entreprise}, pour les avoir à la date ${x.f.duree}. Le temps a un prix, et il pèse d'autant plus que le flux arrive tard.`,
          "Le taux ne dépend pas du financement du projet : il mesure le risque de l'activité. Le coût d'un emprunt éventuel est déjà dans ce taux ; le compter aussi dans les flux le ferait payer deux fois.",
        ];
      },
    },
    {
      id: "predire-le-bfr",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le BFR",
      notions: ["bfr", "discounting"],
      question: (c) => {
        const x = gammeDuChapitre(c);
        return `Avant de calculer, pariez. Le BFR de la gamme, ${pct(x.p.partDuBfr * 100)} du chiffre d'affaires, se constitue année après année, et ${x.entreprise} le récupère en entier à la fin du projet. Le compter dans les flux, face à un calcul qui l'oublie, change la VAN comment ?`;
      },
      options: (c) => {
        const x = gammeDuChapitre(c);
        const voir = "Le laboratoire de l'étape suivante compte le BFR ou l'oublie, d'un geste : regardez la VAN.";
        return [
          { texte: "Il la fait baisser : l'argent avancé revient, mais tard, et il a perdu de sa valeur", juste: x.vanSansLeBfr > x.van, retour: `Bon pari. ${voir}` },
          { texte: "Il ne la change pas : tout ce qui est avancé est récupéré à la fin", juste: x.vanSansLeBfr === x.van, retour: `Pari à vérifier. ${voir}` },
          { texte: "Il la fait monter : la récupération de la fin s'ajoute aux flux", juste: x.vanSansLeBfr < x.van, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-gamme",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la gamme",
      notions: ["discounting", "bfr"],
      question: (c) => {
        const x = gammeDuChapitre(c);
        return `Faites vivre le projet A. Comptez le BFR ou oubliez-le, raccourcissez le projet (la ligne et les moules se revendent alors plus tôt, et le BFR revient plus tôt), changez le taux d'actualisation et les ventes de la gamme, en part du plan. Le tableau refait la VAN à chaque geste ; le graphique trace la VAN selon le taux, BFR compté et BFR oublié. ${x.entreprise} aura peut-être besoin de l'atelier avant ${qte(x.p.duree)} ans : relevez le défi.`;
      },
      leviers: (c) => {
        const x = gammeDuChapitre(c);
        const L = LEVIERS_DU_LABORATOIRE;
        return [
          {
            code: "bfr",
            libelle: "Le BFR dans les flux",
            unite: "",
            min: BFR_OUBLIE,
            max: BFR_COMPTE,
            pas: 1,
            depart: x.plan.bfr,
            choix: [
              { valeur: BFR_OUBLIE, libelle: "oublié" },
              { valeur: BFR_COMPTE, libelle: "compté" },
            ],
          },
          { code: "duree", libelle: "Durée du projet", unite: "ans", min: L.duree.min, max: x.p.duree, pas: L.duree.pas, depart: x.plan.duree },
          { code: "taux", libelle: "Taux d'actualisation", unite: "%", ...L.taux, depart: x.plan.taux },
          { code: "ventes", libelle: "Ventes de la gamme, en part du plan", unite: "%", ...L.ventes, depart: x.plan.ventes },
        ];
      },
      lecture: (c, pos) => {
        const x = gammeDuChapitre(c);
        const l = x.lab(pos);
        const d = x.lab(x.plan);
        return [
          { libelle: "Mise de la date 0", montant: l.mise, reference: d.mise },
          { libelle: "BFR récupéré à la fin du projet", montant: l.bfrRecupere, reference: d.bfrRecupere },
          { libelle: "Valeur résiduelle nette des équipements", montant: l.valeurResiduelle, reference: d.valeurResiduelle },
          { libelle: "Ce qu'oublier le BFR ajoute à la VAN", montant: l.coutDuBfr, reference: d.coutDuBfr },
          { libelle: "VAN du projet", montant: l.van, reference: d.van, effet: true, fort: true },
        ];
      },
      // La VAN selon le taux n'est pas une droite : chaque flux s'actualise par (1 + t)^(−k).
      graphique: (c) => {
        const x = gammeDuChapitre(c);
        return {
          levier: "taux",
          courbes: [
            { libelle: "VAN, BFR compté", valeur: (pos) => laboratoireDeLaGamme(x.p, x.k.impot, pos).vanAvecLeBfr },
            { libelle: "VAN, BFR oublié", valeur: (pos) => laboratoireDeLaGamme(x.p, x.k.impot, pos).vanSansLeBfr },
          ],
        };
      },
      defi: (c) => {
        const x = gammeDuChapitre(c);
        const auPlan = (pos: Readonly<Record<string, number>>) => pos.bfr === BFR_COMPTE && Math.abs(pos.taux! - x.tauxPct) < 1e-9 && pos.ventes === 100;
        return {
          consigne: `Trouvez la durée la plus courte où le projet crée encore de la valeur, BFR compté, à ${pct(x.tauxPct)} et aux ventes du plan.`,
          atteint: (pos) => auPlan(pos) && pos.duree === x.dureeMinimale,
          indice: (pos) => {
            if (pos.bfr !== BFR_COMPTE) return "Le BFR est oublié : le défi demande de le compter, comme le fait un vrai plan de financement.";
            if (!auPlan(pos)) return `Remettez le taux à ${pct(x.tauxPct)} et les ventes au plan, 100 % : seule la durée doit changer.`;
            const v = x.lab(pos).van;
            return v > 0
              ? `À ${qte(pos.duree!)} ans, la VAN vaut encore ${eur(v)} : le projet peut être plus court.`
              : `À ${qte(pos.duree!)} ans, la VAN vaut ${eur(v)} : le projet détruit de la valeur, allongez-le.`;
          },
          solution: { ...x.plan, duree: x.dureeMinimale },
        };
      },
      explication: (c, pos) => {
        const x = gammeDuChapitre(c);
        const d = pos.duree!;
        const ici = x.lab({ duree: d });
        const avant = x.lab({ duree: d - 1 });
        return [
          `À ${qte(d)} ans, la VAN vaut ${eur(ici.van)} ; à ${qte(d - 1)} ans, ${eur(avant.van)}. Plus court, le projet revend sa ligne plus cher et récupère son BFR plus tôt, mais il perd les années où la gamme rapporte le plus.`,
          avant.vanSansLeBfr > 0
            ? `Basculez le BFR sur « oublié » : à ${qte(d - 1)} ans, la VAN paraîtrait de ${eur(avant.vanSansLeBfr)}. Oublier le BFR ferait accepter un projet qui détruit de la valeur. Le graphique le montre à chaque taux : la courbe du BFR oublié passe au-dessus de l'autre.`
            : `Basculez le BFR sur « oublié » : la VAN monte à chaque durée, et à chaque taux sur le graphique. L'oubli flatte toujours le projet.`,
          `La VAN selon le taux n'est pas une droite : elle baisse vite d'abord, puis moins vite. Au plan, elle coupe zéro vers ${pct(auCentieme(x.tri * 100), 1)} : c'est le taux de rentabilité interne, l'objet du chapitre suivant.`,
        ];
      },
    },
    {
      id: "le-bfr",
      objectifs: [0, 3],
      type: "montants",
      titre: "Le BFR, année après année",
      notions: ["bfr"],
      tableau: (c) => {
        const x = gammeDuChapitre(c);
        return {
          titre: "Le chiffre d'affaires différentiel de la gamme",
          colonnes: ["Chiffre d'affaires"],
          lignes: x.f.annees.map((a) => ({ libelle: `N+${a.annee}`, valeurs: [eur(a.chiffreDAffaires)] })),
        };
      },
      question: () =>
        "Sans formule cette fois. Dites ce que le BFR fait sortir ou rentrer à quatre dates du projet. Une variation est positive quand le BFR augmente (de l'argent sort), négative quand il baisse (de l'argent revient).",
      champs: (c) => {
        const x = gammeDuChapitre(c);
        const b = x.f.annees.map((a) => a.bfr);
        const v = x.f.variationsDuBfr;
        const part = pct(x.p.partDuBfr * 100);
        return [
          { libelle: "BFR avancé à la date 0", attendu: v[0]!, calcul: `${part} × ${eur(x.f.annees[0]!.chiffreDAffaires)}, le BFR de N+1, constitué au 1er janvier N+1 : ${eur(v[0]!)}` },
          { libelle: "Variation du BFR à la date 1", attendu: v[1]!, calcul: `le BFR de N+2 moins celui de N+1 : ${eur(b[1]!)} − ${eur(b[0]!)} = ${eur(v[1]!)}` },
          { libelle: "Variation du BFR à la date 4", attendu: v[4]!, calcul: `le BFR de N+5 moins celui de N+4 : ${eur(b[4]!)} − ${eur(b[3]!)} = ${eur(v[4]!)}, de l'argent qui revient` },
          { libelle: `BFR récupéré à la date ${x.f.duree}`, attendu: x.f.recuperationDuBfr, calcul: `le BFR de N+${x.f.duree}, rendu en entier à la fin du projet : ${eur(x.f.recuperationDuBfr)}` },
        ];
      },
      explication: (c) => {
        const x = gammeDuChapitre(c);
        const v = x.f.variationsDuBfr;
        const avances = auCentime(v.reduce((s, y) => s + y, 0));
        return [
          `Le BFR suit le chiffre d'affaires : il monte avec le lancement, plafonne, puis se dégonfle en N+5 quand la gamme vieillit. Au total, ${x.entreprise} avance ${eur(avances)} (${v.slice(0, x.f.duree).map(entre).join(" + ")}), exactement ce qui lui revient à la fin : le BFR n'est pas une charge, c'est de l'argent immobilisé.`,
          "Une variation du BFR se place au début de l'année qui la demande : celle de N+2 tombe à la date 1, le 31 décembre N+1. Le chapitre suit la convention de la fiche : le BFR de l'année se constitue en même temps que l'année commence.",
        ];
      },
    },
    {
      id: "la-valeur-residuelle",
      objectifs: [0],
      type: "montants",
      titre: "La valeur résiduelle",
      notions: ["depreciation"],
      question: (c) => {
        const x = gammeDuChapitre(c);
        return `Au bout de N+${x.f.duree}, ${x.entreprise} arrête la gamme et revend ${x.ligne.libelle}. Calculez sa valeur nette comptable, son prix de cession, puis la valeur résiduelle nette d'impôt de tout le projet.`;
      },
      champs: (c) => {
        const x = gammeDuChapitre(c);
        const ligne = x.p.actifs[0]!;
        const r = x.ligne;
        return [
          {
            libelle: `Valeur nette comptable de la ligne à la fin de N+${x.f.duree}`,
            attendu: r.vnc,
            calcul: `${eur(ligne.montant)} − ${qte(x.f.duree)} × ${eur(ligne.montant / ligne.dureeDAmortissement)} = ${eur(r.vnc)}`,
          },
          { libelle: "Prix de cession de la ligne", attendu: r.prixDeCession, calcul: `${pct(ligne.tauxDeReprise * 100)} × ${eur(r.vnc)} = ${eur(r.prixDeCession)}` },
          {
            libelle: "Valeur résiduelle nette d'impôt du projet",
            attendu: x.f.valeurResiduelle,
            calcul: `${eur(r.prixDeCession)} + ${pct(x.impotPct)} × (${eur(r.vnc)} − ${eur(r.prixDeCession)}) = ${eur(r.nette)}, et rien pour les moules, amortis en entier : ${eur(x.f.valeurResiduelle)}`,
          },
        ];
      },
      explication: (c) => {
        const x = gammeDuChapitre(c);
        const r = x.ligne;
        return [
          `La ligne se revend ${eur(r.prixDeCession)}, sous sa valeur nette comptable : la moins-value, ${eur(-r.plusOuMoinsValue)}, est une charge qui fait économiser ${eur(-r.impot)} d'impôt. Ce qui compte, c'est l'argent que la revente rend, impôt compris, et non la valeur des comptes.`,
          "Une revente au-dessus de la valeur nette comptable ferait l'inverse : la plus-value paierait l'impôt, et la valeur résiduelle nette serait inférieure au prix de cession.",
        ];
      },
    },
    {
      id: "les-flux-disponibles",
      objectifs: [2],
      type: "montants",
      titre: "Les flux de trésorerie disponibles et la VAN",
      notions: ["discounting", "bfr"],
      tableau: (c) => {
        const x = gammeDuChapitre(c);
        return {
          titre: "Les éléments des flux du projet A",
          colonnes: ["Équipements", "Flux d'exploitation après impôt"],
          lignes: x.f.flux.map((_, d) => ({
            libelle: nomDeLaDate(d),
            valeurs: [d === 0 ? eur(-x.f.investissement) : d === x.f.duree ? `${eur(x.f.valeurResiduelle)} de valeur résiduelle nette` : "", d === 0 ? "" : eur(x.f.annees[d - 1]!.fluxDExploitation)],
          })),
        };
      },
      question: (c) => {
        const x = gammeDuChapitre(c);
        return `Dressez le tableau des flux de trésorerie disponibles du projet A, BFR compris, et donnez-en quatre dates. Puis actualisez à ${pct(x.tauxPct)} et calculez la VAN.`;
      },
      champs: (c) => {
        const x = gammeDuChapitre(c);
        const v = x.f.variationsDuBfr;
        const fe = (d: number) => x.f.annees[d - 1]!.fluxDExploitation;
        const n = x.f.duree;
        return [
          { libelle: "Flux disponible de la date 0", attendu: x.f.flux[0]!, calcul: `−${eur(x.f.investissement)} d'équipements − ${eur(v[0]!)} de BFR = ${eur(x.f.flux[0]!)}` },
          { libelle: "Flux disponible de la date 1", attendu: x.f.flux[1]!, calcul: `${eur(fe(1))} − ${entre(v[1]!)} de BFR = ${eur(x.f.flux[1]!)}` },
          { libelle: "Flux disponible de la date 4", attendu: x.f.flux[4]!, calcul: `${eur(fe(4))} − ${entre(v[4]!)} de BFR = ${eur(x.f.flux[4]!)}` },
          {
            libelle: `Flux disponible de la date ${n}`,
            attendu: x.f.flux[n]!,
            calcul: `${eur(fe(n))} + ${eur(x.f.valeurResiduelle)} de valeur résiduelle + ${eur(x.f.recuperationDuBfr)} de BFR récupéré = ${eur(x.f.flux[n]!)}`,
          },
          {
            libelle: "VAN du projet A",
            attendu: x.van,
            calcul: `${x.f.flux.map((fl, d) => `${entre(fl)} × ${coef4(x.coefs[d]!)}`).join(" + ")} = ${eur(x.van)}`,
            tolerance: x.tolerance,
          },
        ];
      },
      explication: (c) => {
        const x = gammeDuChapitre(c);
        return [
          `La VAN est positive, ${eur(x.van)} : la gamme rend plus que les ${pct(x.tauxPct)} par an qu'exigent les capitaux de ${x.entreprise}, et crée cette valeur en euros d'aujourd'hui. Sans actualiser, les flux des dates 1 à ${x.f.duree} font ${eur(x.sommeDesFlux)} pour une mise de ${eur(-x.f.flux[0]!)} : attendre a un prix.`,
          `Le flux de la date 1 est négatif, ${eur(x.f.flux[1]!)} : l'année de lancement perd de l'argent, et la montée du BFR en demande encore. Un projet se juge sur tous ses flux, pas sur sa première année.`,
        ];
      },
    },
    {
      id: "ce-que-coute-le-bfr",
      objectifs: [3],
      type: "montants",
      titre: "Ce que coûte le BFR",
      notions: ["bfr", "discounting"],
      question: () =>
        "Un premier calcul du directeur commercial oubliait le BFR. Calculez la VAN qu'il trouvait, ce que vaut aujourd'hui le BFR récupéré à la fin, puis ce que le BFR coûte vraiment en VAN.",
      champs: (c) => {
        const x = gammeDuChapitre(c);
        const n = x.f.duree;
        return [
          {
            libelle: "VAN si l'on oubliait le BFR",
            attendu: x.vanSansLeBfr,
            calcul: `${x.sans.map((fl, d) => `${entre(fl)} × ${coef4(x.coefs[d]!)}`).join(" + ")} = ${eur(x.vanSansLeBfr)}`,
            tolerance: x.toleranceSansBfr,
          },
          {
            libelle: `Valeur actuelle du BFR récupéré à la date ${n}`,
            attendu: x.vaDuBfrRecupere,
            calcul: `${eur(x.f.recuperationDuBfr)} × ${coef4(x.coefs[n]!)} = ${eur(x.vaDuBfrRecupere)}`,
            tolerance: toleranceDActualisation([x.f.recuperationDuBfr]),
          },
          {
            libelle: "Coût du BFR en VAN",
            attendu: x.coutDuBfr,
            calcul: `${eur(x.vanSansLeBfr)} − ${eur(x.van)} = ${eur(x.coutDuBfr)}`,
            tolerance: x.toleranceSansBfr + x.tolerance,
          },
        ];
      },
      explication: (c) => {
        const x = gammeDuChapitre(c);
        return [
          `Le BFR n'est qu'avancé : ${x.entreprise} récupère ${eur(x.f.recuperationDuBfr)} à la fin. Mais ces euros sortent tôt et reviennent tard ; récupérés à la date ${x.f.duree}, ils ne valent plus que ${eur(x.vaDuBfrRecupere)} aujourd'hui. Le BFR coûte ${eur(x.coutDuBfr)} de VAN, ${pct(x.partDuBfr)} de la VAN du projet.`,
          "Oublier le BFR, c'est surestimer la VAN d'un projet qui fait vendre, et d'autant plus que le BFR monte vite et revient tard. Le laboratoire l'a montré : sur un projet court, l'oubli fait passer une VAN négative pour positive.",
        ];
      },
    },
    {
      id: "decision",
      objectifs: [2],
      type: "choix",
      titre: "Lancer la gamme ou non",
      notions: ["discounting", "profitability_vs_return"],
      question: (c) => {
        const x = gammeDuChapitre(c);
        return `La VAN du projet A est de ${eur(x.van)} à ${pct(x.tauxPct)}. Que décider, et pourquoi ?`;
      },
      options: (c) => {
        const x = gammeDuChapitre(c);
        return [
          {
            texte: "Lancer : la VAN est positive, la gamme rend plus que le coût du capital",
            juste: x.verdict === "investir",
            retour:
              x.verdict === "investir"
                ? `Oui : actualisés à ${pct(x.tauxPct)}, ses flux couvrent la mise et laissent ${eur(x.van)} de valeur à ${x.entreprise}.`
                : `Non : la VAN est négative, ${eur(x.van)}.`,
          },
          {
            texte: "Renoncer : la gamme perd de l'argent la première année",
            juste: false,
            retour: `Non : le flux de la date 1, ${eur(x.f.flux[1]!)}, est dans la VAN, comme tous les autres. La VAN les pèse tous ; juger un projet sur sa première année, c'est oublier les suivantes.`,
          },
          {
            texte: "Lancer : sans actualiser, les flux font plus du double de la mise",
            juste: false,
            retour: `Non : la décision est bonne, la raison ne l'est pas. Les flux non actualisés, ${eur(x.sommeDesFlux)}, ignorent le coût du capital : un projet peut rendre plus que sa mise et détruire de la valeur. Seule la VAN le dit.`,
          },
          {
            texte: "Renoncer : la ligne ne sera pas amortie à la fin du projet",
            juste: false,
            retour: `Non : qu'il reste ${eur(x.ligne.vnc)} à amortir ne coûte rien en soi. La revente en rend ${eur(x.ligne.nette)}, impôt compris, et la VAN l'a compté.`,
          },
        ];
      },
    },
    {
      id: "predire-les-ventes",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur les ventes",
      notions: ["discounting", "safety_margin"],
      question: () =>
        "Les ventes de la gamme sont une prévision. Avant de faire varier le plan, pariez : de combien les ventes peuvent-elles le manquer, toutes ensemble, avant que la VAN ne tombe à zéro ?",
      options: (c) => {
        const x = gammeDuChapitre(c);
        const m = x.margeDesVentes;
        const voir = "Le curseur de l'étape suivante fait varier les ventes : cherchez où la VAN s'annule.";
        const pari = (texte: string, juste: boolean) => ({ texte, juste, retour: `${juste ? "Bon pari" : "Pari à vérifier"}. ${voir}` });
        return [
          pari("De moins de 10 % : la VAN est mince face à la mise", m < 10),
          pari("De 10 % à 25 % : la VAN tient, sans plus", m >= 10 && m <= 25),
          pari("De plus de 25 % : la VAN est large", m > 25),
        ];
      },
    },
    {
      id: "les-ventes-au-curseur",
      objectifs: [4],
      type: "curseur",
      titre: "Faites varier les ventes",
      notions: ["discounting", "safety_margin"],
      question: (c) => {
        const x = gammeDuChapitre(c);
        return `Faites varier les ventes de la gamme, toutes ensemble, de ${pct(VENTES_DU_CURSEUR.min)} à ${pct(VENTES_DU_CURSEUR.max)} du plan. Une droite donne ce que la gamme rapporte en valeur actuelle, BFR compris ; l'autre, les ${eur(x.equipements)} d'équipements de la date 0. Placez le curseur sur les ventes les plus basses où la VAN reste positive, puis validez.`;
      },
      grandeur: () => ({ libelle: "Ventes de la gamme, en part du plan", unite: "% du plan" }),
      cible: (c) => ({ attendu: gammeDuChapitre(c).seuilEntierDesVentes, min: VENTES_DU_CURSEUR.min, max: VENTES_DU_CURSEUR.max }),
      zones: ["La gamme crée de la valeur", "La gamme détruit de la valeur"],
      rates: () => ({
        dessous: "À cette position, la VAN est négative : les ventes ne paient pas la mise au coût du capital.",
        dessus: "Plus bas, la VAN reste positive : cherchez les ventes les plus basses.",
      }),
      montrer: "Montrer le seuil",
      lecture: (c, q) => {
        const x = gammeDuChapitre(c);
        const f = fluxDuProjet(x.p, { ventes: q / 100, tauxDeLImpot: x.k.impot });
        const a = f.annees[ANNEE_GUIDEE - 1]!;
        return [
          { libelle: `Chiffre d'affaires de N+${ANNEE_GUIDEE}`, montant: a.chiffreDAffaires },
          { libelle: `Flux d'exploitation de N+${ANNEE_GUIDEE}`, montant: a.fluxDExploitation },
          { libelle: `BFR de N+${ANNEE_GUIDEE}`, montant: a.bfr },
          { libelle: "VAN du projet", montant: van(f.flux, x.t), fort: true },
        ];
      },
      droites: (c) => {
        const x = gammeDuChapitre(c);
        return {
          produit: (q) => x.vanAuxVentes(q) + x.equipements,
          cout: () => x.equipements,
          libelles: ["Ce que rapporte la gamme, en valeur actuelle", "Équipements de la date 0"],
        };
      },
      explication: (c) => {
        const x = gammeDuChapitre(c);
        return [
          `La VAN s'annule entre ${pct(x.seuilEntierDesVentes - 1)} et ${pct(x.seuilEntierDesVentes)} du plan : les ventes peuvent manquer le plan d'un peu plus de ${pct(Math.floor(x.margeDesVentes))} avant que la gamme ne détruise de la valeur. C'est la marge de sécurité du projet.`,
          `La droite monte de ${eur(x.penteDesVentes)} par point de ventes : chaque point de ventes en plus apporte sa marge après impôt, moins le BFR qu'il immobilise, actualisés. L'étape suivante en tire le seuil exact.`,
        ];
      },
    },
    {
      id: "le-seuil-des-ventes",
      objectifs: [4],
      type: "montants",
      titre: "Les ventes qui annulent la VAN",
      notions: ["safety_margin", "discounting"],
      question: (c) => {
        const x = gammeDuChapitre(c);
        return `Retrouvez à rebours le seuil que le curseur a montré. La VAN est affine dans les ventes : calculez-la à ${pct(x.VENTES_BASSES)} du plan, déduisez ce qu'apporte chaque point de ventes, puis les ventes qui annulent la VAN, en pour cent du plan.`;
      },
      champs: (c) => {
        const x = gammeDuChapitre(c);
        const f = fluxDuProjet(x.p, { ventes: x.VENTES_BASSES / 100, tauxDeLImpot: x.k.impot });
        return [
          {
            libelle: `VAN à ${pct(x.VENTES_BASSES)} du plan`,
            attendu: x.vanAuxVentesBasses,
            calcul: `les quantités, le chiffre d'affaires, le BFR et l'impôt à ${pct(x.VENTES_BASSES)} : flux de ${f.flux.map(entre).join(", ")}, actualisés à ${pct(x.tauxPct)} : ${eur(x.vanAuxVentesBasses)}`,
            tolerance: toleranceDActualisation(f.flux),
          },
          {
            libelle: "VAN apportée par un point de ventes",
            attendu: x.penteDesVentes,
            calcul: `(${eur(x.van)} − ${entre(x.vanAuxVentesBasses)}) ÷ ${qte(100 - x.VENTES_BASSES)} = ${eur(x.penteDesVentes)}`,
            tolerance: Math.ceil(toleranceDActualisation(f.flux) / 10) + 1,
          },
          {
            libelle: "Ventes qui annulent la VAN (% du plan)",
            attendu: x.seuilDesVentes,
            calcul: `100 − ${eur(x.van)} ÷ ${eur(x.penteDesVentes)} = ${pct(x.seuilDesVentes)}`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const x = gammeDuChapitre(c);
        return [
          `À ${pct(x.seuilDesVentes)} du plan, la VAN est nulle : la gamme rend tout juste les ${pct(x.tauxPct)} qu'exigent les capitaux. La marge de sécurité est de ${pct(x.margeDesVentes)} des ventes.`,
          "Le calcul tient parce que la VAN est affine dans les ventes : prix et coûts variables fixes, BFR proportionnel au chiffre d'affaires, impôt proportionnel au résultat, même négatif. Il ne tiendrait plus si une baisse des ventes changeait aussi les charges fixes, ou si le projet faisait perdre son bénéfice à l'entreprise.",
        ];
      },
    },
    {
      id: "le-prix-de-studio",
      objectifs: [4],
      type: "curseur",
      titre: "Le prix de NOVA Studio",
      notions: ["discounting", "safety_margin"],
      question: (c) => {
        const x = gammeDuChapitre(c);
        return `Les ventes restent au plan ; seul le prix de ${nomDu(x.studio)} change, de ${eur(PRIX_DU_CURSEUR.min)} à ${eur(PRIX_DU_CURSEUR.max)} (${eur(x.studio.prix)} au plan). Placez le curseur sur le prix le plus bas où la VAN reste positive, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Prix de ${nomDu(gammeDuChapitre(c).studio)}`, unite: "€" }),
      cible: (c) => ({ attendu: gammeDuChapitre(c).prixEntier, min: PRIX_DU_CURSEUR.min, max: PRIX_DU_CURSEUR.max }),
      zones: ["La gamme crée de la valeur", "La gamme détruit de la valeur"],
      rates: () => ({
        dessous: "À ce prix, la VAN est négative : la marge de chaque enceinte ne paie plus la mise.",
        dessus: "Plus bas, la VAN reste positive : cherchez le prix le plus bas.",
      }),
      montrer: "Montrer le prix plancher",
      lecture: (c, prix) => {
        const x = gammeDuChapitre(c);
        const f = fluxDuProjet(x.p, { prix: { [x.studio.code]: prix }, tauxDeLImpot: x.k.impot });
        return [
          { libelle: `Marge sur coût variable d'une ${nomDu(x.studio)}`, montant: auCentime(prix - x.studio.coutVariable) },
          { libelle: `Flux d'exploitation de N+${ANNEE_GUIDEE}`, montant: f.annees[ANNEE_GUIDEE - 1]!.fluxDExploitation },
          { libelle: "VAN du projet", montant: van(f.flux, x.t), fort: true },
        ];
      },
      droites: (c) => {
        const x = gammeDuChapitre(c);
        return {
          produit: (prix) => x.vanAuPrix(prix) + x.equipements,
          cout: () => x.equipements,
          libelles: ["Ce que rapporte la gamme, en valeur actuelle", "Équipements de la date 0"],
        };
      },
      explication: (c) => {
        const x = gammeDuChapitre(c);
        return [
          `La VAN s'annule entre ${eur(x.prixEntier - 1)} et ${eur(x.prixEntier)} : le prix plancher exact est de ${eur(x.prixPlancher)}, soit ${eur(x.studio.prix)} − ${eur(x.van)} ÷ ${eur(x.penteDuPrix)}. Chaque euro de moins sur ${nomDu(x.studio)} retire ${eur(x.penteDuPrix)} de VAN : sur ${qte(x.studioSurLeProjet)} enceintes vendues en ${qte(x.f.duree)} ans, il coûte sa marge après impôt, moins le BFR qu'il libère, actualisés.`,
          `Une baisse de ${pct(x.baisseDuPrix)} du prix de ${nomDu(x.studio)} suffit à effacer la VAN.`,
        ];
      },
    },
    {
      id: "quel-risque-surveiller",
      objectifs: [4],
      type: "choix",
      titre: "Quel risque surveiller",
      notions: ["safety_margin", "contribution_margin"],
      question: (c) => {
        const x = gammeDuChapitre(c);
        return `Les ventes de la gamme peuvent manquer le plan de ${pct(x.margeDesVentes)} avant que la VAN ne s'annule ; le prix de ${nomDu(x.studio)} peut baisser de ${pct(x.baisseDuPrix)}. Le directeur commercial ne suivra qu'un indicateur au lancement. Lequel lui conseillez-vous ?`;
      },
      options: (c) => {
        const x = gammeDuChapitre(c);
        const mStudio = auCentime(x.studio.prix - x.studio.coutVariable);
        const mGo = auCentime(x.go.prix - x.go.coutVariable);
        return [
          {
            texte: `Le prix de ${nomDu(x.studio)}, qui porte la marge de la gamme`,
            juste: x.baisseDuPrix < x.margeDesVentes,
            retour: `Oui : ${pct(x.baisseDuPrix)} de baisse suffisent, quand les ventes peuvent manquer le plan de ${pct(x.margeDesVentes)}. Une ${nomDu(x.studio)} laisse ${eur(mStudio)} de marge sur coût variable, une ${nomDu(x.go)} ${eur(mGo)} : une remise sur ${nomDu(x.studio)} frappe le cœur de la valeur.`,
          },
          {
            texte: `Les ventes de ${nomDu(x.go)}, les plus nombreuses`,
            juste: false,
            retour: `Non : le nombre ne fait pas la valeur. ${nomDu(x.go)} ne laisse que ${eur(mGo)} de marge par enceinte ; un écart sur ses ventes pèse peu sur la VAN.`,
          },
          {
            texte: "Le volume de toute la gamme, dont la marge de sécurité est la plus étroite",
            juste: x.baisseDuPrix >= x.margeDesVentes,
            retour:
              x.baisseDuPrix >= x.margeDesVentes
                ? `Oui : ${pct(x.margeDesVentes)} de ventes en moins suffisent, quand le prix peut baisser de ${pct(x.baisseDuPrix)}.`
                : `Non : c'est l'inverse. Le volume peut manquer le plan de ${pct(x.margeDesVentes)} ; le prix de ${nomDu(x.studio)}, de ${pct(x.baisseDuPrix)} seulement.`,
          },
          {
            texte: "Le taux d'actualisation, qui change toute la VAN",
            juste: false,
            retour: "Non : le taux mesure le risque de l'activité, il ne se pilote pas au lancement. Le directeur commercial suit ce qu'il peut tenir : le prix et les ventes.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["discounting", "bfr", "depreciation"],
      tableau: (c) => tableauDesFlux(gammeDuChapitre(c)),
      texte: (c) => {
        const x = gammeDuChapitre(c);
        return [
          `Chez ${x.entreprise}, la gamme sur une seconde ligne manuelle demande ${eur(-x.f.flux[0]!)} à la date 0, équipements et BFR de départ. Ses flux de trésorerie disponibles, impôt et BFR compris, valent ${eur(x.van)} de plus que la mise, actualisés à ${pct(x.tauxPct)} : la VAN est positive, le lancement crée de la valeur.`,
          `Trois pièges. L'impôt d'une année en perte est une économie, quand l'entreprise est bénéficiaire. Le BFR se compte, même s'il revient : l'oublier ajoute ${eur(x.coutDuBfr)} à la VAN, et peut faire accepter un projet trop court. Et la VAN dépend d'hypothèses : elle s'annule à ${pct(x.seuilDesVentes)} des ventes du plan, ou à ${eur(x.prixPlancher)} pour ${nomDu(x.studio)}.`,
          "Au niveau de l'examen, vous savez dresser le tableau des flux de trésorerie disponibles d'un projet, impôt, BFR et valeur résiduelle nette compris, l'actualiser, décider sur le signe de la VAN, et retrouver à rebours la variable qui l'annule.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Flux de trésorerie disponible = EBE − impôt sur le résultat d'exploitation − variation du BFR − investissement + valeur résiduelle nette. Valeur résiduelle nette = prix de cession − impôt × (prix de cession − valeur nette comptable). VAN = somme des flux actualisés ; on investit si elle est positive.",
    },
  ],
};
