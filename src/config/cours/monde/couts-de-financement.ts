import { auCentime } from "./amortissement";
import { augmentationDeCapital, AUGMENTATION_DE_CAPITAL } from "./comptabilite-approfondie";
import { empruntALaCloture } from "./emprunt";
import { CLOTURE_DE_LA_FICHE, CONTRAT_DE_PRET } from "./exercice-de-nova";
import { coutDesCapitauxPropres, tri } from "./finance";
import { comparaison, coutApresImpot, EMPRUNT_DU_PLAN_EQUILIBRE, TAUX_DE_L_IMPOT } from "./financement-de-la-gamme";
import { remboursements, type ModeDuFinancement } from "./financement-du-lycee";
import { PRIME_DE_RISQUE_DU_MARCHE, TAUX_SANS_RISQUE } from "./projets-et-financement";

/**
 * LE MONDE DU COURS : ARBITRER LES COÛTS DE FINANCEMENT (DCG UE6 3.3).
 *
 * Fiche figée et modèle du chapitre « Arbitrer les coûts de financement » et de son cas. Elle ne lit
 * jamais l'arène. Elle reprend, sans les recopier, les chiffres que les autres chapitres de NOVA ont
 * posés (une seule NOVA) :
 *   · L'EMPRUNT DE N+1 est celui qui équilibre le plan de financement de la gamme (80 000 €,
 *     monde/financement-de-la-gamme.ts), au taux du prêt de NOVA (5 %), sur 5 ans ;
 *   · L'IMPÔT est le taux marginal de NOVA, 25 % ;
 *   · LE CRÉDIT-BAIL de la ligne a le coût après impôt que le chapitre « Emprunt ou crédit-bail »
 *     calcule (`comparaison`) ;
 *   · L'AUGMENTATION DE CAPITAL est celle de juin N+1 (monde/comptabilite-approfondie.ts) : 1 action
 *     nouvelle pour 3 anciennes, à 12 €, 60 000 € levés ;
 *   · LE MARCHÉ est celui de la fiche des projets : 3 % sans risque, 6 % de prime ;
 *   · LES DETTES FINANCIÈRES du 31 décembre N sont le capital dû du prêt de l'exercice (68 000 €).
 *
 * CONVENTIONS : les taux sont des fractions ; les flux d'un financement se lisent du côté de NOVA
 * (positif : ce qu'elle reçoit, négatif : ce qu'elle paie), de la date 0 (le jour où elle reçoit les
 * fonds) à la fin de la dernière année.
 */

// ═════════════════════════════════════════════════════════════════════════════
// 1. L'EMPRUNT BANCAIRE : TROIS FAÇONS DE REMBOURSER
// ═════════════════════════════════════════════════════════════════════════════

/** L'emprunt de N+1 : celui qui équilibre le plan de la gamme, au taux du prêt de NOVA, sur 5 ans. */
export const EMPRUNT_DE_N_PLUS_1 = { montant: EMPRUNT_DU_PLAN_EQUILIBRE, taux: CONTRAT_DE_PRET.tauxAnnuel, dureeAns: 5 } as const;

/** LES FRAIS DE DOSSIER que demanderait la banque (hypothèse du cours) : 1 % du capital, payés le jour du versement. */
export const FRAIS_DE_DOSSIER = auCentime(EMPRUNT_DE_N_PLUS_1.montant * 0.01);

/** Les trois modes du programme, dans l'ordre où le chapitre les présente. */
export const MODES_DE_L_EMPRUNT: readonly { mode: ModeDuFinancement; libelle: string }[] = [
  { mode: "in-fine", libelle: "In fine" },
  { mode: "echeances-constantes", libelle: "Annuité constante" },
  { mode: "amortissement-constant", libelle: "Amortissement constant" },
];

/** Le tableau d'amortissement de l'emprunt de N+1 dans un mode, avec le capital dû au début de chaque année. */
export function tableauDeLEmprunt(mode: ModeDuFinancement, montant: number = EMPRUNT_DE_N_PLUS_1.montant) {
  let du = montant;
  const annees = remboursements({ taux: EMPRUNT_DE_N_PLUS_1.taux, dureeAns: EMPRUNT_DE_N_PLUS_1.dureeAns, mode }, montant).map((r) => {
    const a = { annee: r.annee, capitalDebut: du, interets: r.interets, amortissement: r.capital, annuite: r.total, capitalFin: auCentime(du - r.capital) };
    du = a.capitalFin;
    return a;
  });
  return {
    mode,
    annees,
    interets: auCentime(annees.reduce((s, a) => s + a.interets, 0)),
    total: auCentime(annees.reduce((s, a) => s + a.annuite, 0)),
    /** Les flux du côté de NOVA : le capital reçu, puis les annuités. */
    flux: [montant, ...annees.map((a) => -a.annuite)],
  };
}

/** Le taux actuariel d'un financement : le taux qui annule la valeur actuelle de ses flux, cherché entre 0 % et 100 %. */
export const coutActuariel = (flux: readonly number[]) => tri(flux, { bas: 0, haut: 1 })!;

/**
 * LES FLUX APRÈS IMPÔT d'un emprunt : chaque année, l'annuité moins l'économie d'impôt sur ses
 * intérêts ; les frais de dossier, déductibles l'année du versement, rendent leur impôt à la fin de
 * la première année.
 */
export function fluxApresImpot(mode: ModeDuFinancement, frais = 0, t = TAUX_DE_L_IMPOT) {
  const e = tableauDeLEmprunt(mode);
  return [auCentime(EMPRUNT_DE_N_PLUS_1.montant - frais), ...e.annees.map((a) => auCentime(-a.annuite + a.interets * t + (a.annee === 1 ? frais * t : 0)))];
}

/** Les trois modes comparés : intérêts, première annuité, coût actuariel avant et après impôt, avec et sans frais. */
export function lesTroisModes() {
  return MODES_DE_L_EMPRUNT.map(({ mode, libelle }) => {
    const e = tableauDeLEmprunt(mode);
    return {
      mode,
      libelle,
      tableau: e,
      interets: e.interets,
      premiereAnnuite: e.annees[0]!.annuite,
      avantImpot: coutActuariel(e.flux),
      apresImpot: coutActuariel(fluxApresImpot(mode)),
      avecFrais: coutActuariel([auCentime(EMPRUNT_DE_N_PLUS_1.montant - FRAIS_DE_DOSSIER), ...e.flux.slice(1)]),
      apresImpotAvecFrais: coutActuariel(fluxApresImpot(mode, FRAIS_DE_DOSSIER)),
    };
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. L'EMPRUNT OBLIGATAIRE CLASSIQUE, IN FINE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE PLACEMENT PRIVÉ OBLIGATAIRE (hypothèse du cours) : la banque propose à NOVA, au lieu du prêt,
 * de placer auprès de quelques investisseurs 800 obligations de 100 € de nominal, émises à 98 €,
 * avec un coupon de 4,5 %, remboursées au pair dans 5 ans, in fine ; les frais d'émission sont de
 * 1 600 €. La prime de remboursement (2 € par titre) et les frais s'étalent sur la durée de
 * l'emprunt, en charges déductibles, à parts égales.
 */
export const PLACEMENT_PRIVE = { titres: 800, nominal: 100, prixDEmission: 98, tauxNominal: 0.045, dureeAns: 5, frais: 1_600 } as const;

/** L'emprunt obligataire : fonds nets, coupons, flux avant et après impôt, coûts actuariels. */
export function empruntObligataire(t = TAUX_DE_L_IMPOT) {
  const p = PLACEMENT_PRIVE;
  const nominal = p.titres * p.nominal;
  const emission = p.titres * p.prixDEmission;
  const fondsNets = auCentime(emission - p.frais);
  const coupons = auCentime(nominal * p.tauxNominal);
  const prime = auCentime(nominal - emission);
  const chargeEtalee = auCentime((prime + p.frais) / p.dureeAns);
  const economie = auCentime((coupons + chargeEtalee) * t);
  const avant = [fondsNets, ...Array.from({ length: p.dureeAns }, (_, k) => auCentime(-coupons - (k === p.dureeAns - 1 ? nominal : 0)))];
  const apres = [fondsNets, ...avant.slice(1).map((f) => auCentime(f + economie))];
  return { ...p, nominal, emission, fondsNets, coupons, prime, chargeEtalee, economie, avant, apres, avantImpot: coutActuariel(avant), apresImpot: coutActuariel(apres) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LE COÛT DES CAPITAUX PROPRES ET L'AUGMENTATION DE CAPITAL
// ═════════════════════════════════════════════════════════════════════════════

/** LE PRIX DE L'ACTION DE NOVA : celui que les nouveaux associés paient en juin N+1, 12 €. */
export const PRIX_DE_L_ACTION = AUGMENTATION_DE_CAPITAL.prixDEmission;

/**
 * LA POLITIQUE DE DIVIDENDE ANNONCÉE (hypothèse du cours) : un dividende de 0,60 € par action versé
 * en N+2, puis en hausse de 4 % par an, au rythme où NOVA compte faire croître son bénéfice.
 */
export const DIVIDENDE_ANNONCE = { premier: 0.6, croissance: 0.04 } as const;

/** Le coût des capitaux propres par le dividende constant : D ÷ P. */
export const coutParLeDividendeConstant = (d = DIVIDENDE_ANNONCE.premier, p = PRIX_DE_L_ACTION) => d / p;

/** Le coût des capitaux propres par le dividende en progression (Gordon et Shapiro) : D1 ÷ P + g. */
export const coutParLeDividendeEnProgression = (d = DIVIDENDE_ANNONCE.premier, p = PRIX_DE_L_ACTION, g = DIVIDENDE_ANNONCE.croissance) => d / p + g;

/**
 * LE BÊTA DES CAPITAUX PROPRES DE NOVA (hypothèse du cours) : 1,1. L'activité de NOVA a le risque du
 * marché (un bêta de 1, fiche des projets) ; endettée pour sa gamme, ses actionnaires portent un peu
 * plus que ce risque. Le programme donne le bêta : il ne se calcule pas ici.
 */
export const BETA_DES_CAPITAUX_PROPRES = 1.1;

/** Le coût des capitaux propres par le MEDAF : Kc = rf + βc × (Rm − rf). */
export const coutParLeMedaf = (beta = BETA_DES_CAPITAUX_PROPRES) => coutDesCapitauxPropres(TAUX_SANS_RISQUE, beta, PRIME_DE_RISQUE_DU_MARCHE);

/** L'ASSOCIÉ QUI NE SOUSCRIT PAS (hypothèse du cours) : il détient 3 000 des 15 000 actions, 20 % du capital. */
export const ACTIONS_DE_L_ASSOCIE = 3_000;

/** L'augmentation de capital vue par les actionnaires : fonds, valeur de l'action, bénéfice par action, contrôle. */
export function augmentationVueParLesActionnaires() {
  const a = augmentationDeCapital();
  const apres = a.actions + a.nouvelles;
  const bpaAvant = auCentime(CLOTURE_DE_LA_FICHE.resultatNet / a.actions);
  const bpaApres = auCentime(CLOTURE_DE_LA_FICHE.resultatNet / apres);
  return {
    ...a,
    actionsApres: apres,
    bpaAvant,
    bpaApres,
    partAvant: ACTIONS_DE_L_ASSOCIE / a.actions,
    partApres: ACTIONS_DE_L_ASSOCIE / apres,
    /** Ce que perd, en valeur, l'associé qui ne souscrit pas et ne reçoit rien en échange. */
    perteDeLAssocie: auCentime(ACTIONS_DE_L_ASSOCIE * (a.valeurAvant - a.valeurApres)),
    /** Le bénéfice qui garderait le bénéfice par action de N avec les actions nouvelles. */
    beneficeQuiGardeLeBpa: auCentime(bpaAvant * apres),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LE COÛT MOYEN PONDÉRÉ DU CAPITAL
// ═════════════════════════════════════════════════════════════════════════════

/** Les dettes financières de NOVA au 31 décembre N : le capital dû du prêt de l'exercice. */
export const DETTES_DU_31_DECEMBRE = empruntALaCloture(CONTRAT_DE_PRET).capitalRestantDu;

/** Une source du capital de NOVA, son montant et son coût après impôt. */
export interface SourceDuCapital {
  libelle: string;
  montant: number;
  cout: number;
}

/**
 * LE CMPC DE NOVA après les financements de N+1, en valeurs du bilan (comme au chapitre « La création
 * de valeur ») : les capitaux propres du 31 décembre N plus l'augmentation de capital, au coût du
 * MEDAF ; les dettes, le prêt de l'exercice et l'emprunt de N+1, au coût de l'emprunt après impôt.
 */
export function cmpcDeNova(sources: readonly SourceDuCapital[] = sourcesDuCapital()) {
  const total = auCentime(sources.reduce((s, x) => s + x.montant, 0));
  const lignes = sources.map((x) => ({ ...x, poids: x.montant / total, contribution: (x.montant / total) * x.cout }));
  return { lignes, total, cmpc: lignes.reduce((s, x) => s + x.contribution, 0) };
}

/** Les sources de la structure visée : capitaux propres après l'augmentation, dettes après l'emprunt de N+1. */
export function sourcesDuCapital(): SourceDuCapital[] {
  const a = augmentationDeCapital();
  return [
    { libelle: "Capitaux propres", montant: a.capitauxPropresApres, cout: coutParLeMedaf() },
    { libelle: "Dettes financières", montant: auCentime(DETTES_DU_31_DECEMBRE + EMPRUNT_DE_N_PLUS_1.montant), cout: coutApresImpot(EMPRUNT_DE_N_PLUS_1.taux) },
  ];
}

/** Le coût du crédit-bail de la ligne après impôt, tel que le chapitre « Emprunt ou crédit-bail » le calcule. */
export const coutDuCreditBail = () => comparaison().tauxDuCreditBail;

// ═════════════════════════════════════════════════════════════════════════════
// 5. LA THÉORIE DU COMPROMIS : L'ÉCONOMIE D'IMPÔT CONTRE LE RISQUE DE FAILLITE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE COMPROMIS DE NOVA (hypothèse du cours, un modèle simplifié de la théorie du compromis) :
 *   · l'actif économique de NOVA vaut 500 000 € sans dette ;
 *   · une dette permanente D fait économiser chaque année l'impôt sur ses intérêts ; actualisée au
 *     taux de la dette, cette économie vaut t × D ;
 *   · la probabilité de défaillance croît avec le carré de l'endettement : (D ÷ 500 000)² ;
 *   · si NOVA défaille, les difficultés (clients qui partent, fournisseurs qui exigent d'être payés
 *     comptant, frais de procédure) lui coûtent 30 % de la valeur de son actif.
 * Le gain net de la dette est l'économie d'impôt moins le coût attendu des difficultés.
 */
export const COMPROMIS = { valeurSansDette: 500_000, partDuCoutDesDifficultes: 0.3 } as const;

/** Les leviers du laboratoire du compromis : la dette, et le coût des difficultés en pour cent de l'actif. */
export const LEVIERS_DU_COMPROMIS = {
  dette: { min: 0, max: 400_000, pas: 25_000 },
  difficultes: { min: 10, max: 50, pas: 10 },
} as const;

/** La valeur de NOVA pour une dette et un coût des difficultés (en pour cent de l'actif). */
export function compromis(dette: number, difficultesEnPourCent: number = COMPROMIS.partDuCoutDesDifficultes * 100, t = TAUX_DE_L_IMPOT) {
  const v = COMPROMIS.valeurSansDette;
  const economie = auCentime(t * dette);
  const probabilite = Math.min(1, (dette / v) ** 2);
  const coutDesDifficultes = auCentime((v * difficultesEnPourCent) / 100);
  const coutAttendu = auCentime(probabilite * coutDesDifficultes);
  const gain = auCentime(economie - coutAttendu);
  return { dette, economie, probabilite, coutDesDifficultes, coutAttendu, gain, valeur: auCentime(v + gain) };
}

/** La dette du laboratoire, au pas de 25 000 €, qui donne le plus grand gain net. */
export function detteOptimale(difficultesEnPourCent: number = COMPROMIS.partDuCoutDesDifficultes * 100) {
  const L = LEVIERS_DU_COMPROMIS.dette;
  let meilleure = L.min;
  for (let d = L.min; d <= L.max; d += L.pas) if (compromis(d, difficultesEnPourCent).gain > compromis(meilleure, difficultesEnPourCent).gain) meilleure = d;
  return meilleure;
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. LE CAS : L'ASSOCIÉ QUI PRÉFÈRE LA DETTE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * L'ASSOCIÉ QUI PRÉFÈRE LA DETTE (le cas, hypothèse du cours) : au lieu de l'augmentation de capital,
 * un associé propose d'emprunter les 60 000 € de plus. La banque prêterait ce supplément à 6 % ; plus
 * endettés, les actionnaires porteraient un risque plus grand : un bêta de 1,4 au lieu de 1,1.
 */
export const DETTE_A_LA_PLACE_DU_CAPITAL = { taux: 0.06, beta: 1.4 } as const;

/** Les deux structures du cas : avec l'augmentation de capital (celle du chapitre), ou avec la dette de plus. */
export function capitalOuDette() {
  const a = augmentationDeCapital();
  const avecLeCapital = cmpcDeNova();
  const d = DETTE_A_LA_PLACE_DU_CAPITAL;
  const avecLaDette = cmpcDeNova([
    { libelle: "Capitaux propres", montant: a.capitauxPropres, cout: coutParLeMedaf(d.beta) },
    { libelle: "Dettes financières", montant: auCentime(DETTES_DU_31_DECEMBRE + EMPRUNT_DE_N_PLUS_1.montant), cout: coutApresImpot(EMPRUNT_DE_N_PLUS_1.taux) },
    { libelle: "Dette de plus", montant: a.fonds, cout: coutApresImpot(d.taux) },
  ]);
  return { avecLeCapital, avecLaDette, coutDeLaDetteEnPlus: coutApresImpot(d.taux), coutDesCapitauxPropres: coutParLeMedaf(d.beta) };
}
